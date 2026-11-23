import { PaymentProviderError } from '../../src/adapters/payment/errors';
import { StripeSubscription } from '../../src/adapters/payment/stripe-api';
import { StripePaymentAdapter, toGatewaySubscription } from '../../src/adapters/payment/stripe.adapter';
import { SubscriptionStatus } from '../../src/domain/entities/subscription';
import { FakeStripeApi, MOCK_WEBHOOK_SIGNATURE } from '../../src/infrastructure/mock/fake-stripe.api';
import { PaymentSimulationState } from '../../src/infrastructure/mock/simulation-state';

const stripeSub = (overrides: Partial<StripeSubscription> = {}): StripeSubscription => ({
  id: 'sub_1',
  customer: 'cus_1',
  status: 'active',
  cancel_at_period_end: false,
  items: { data: [{ current_period_end: 1_800_000_000 }] },
  ...overrides,
});

describe('traducción Stripe -> Wayvo (toGatewaySubscription)', () => {
  it.each([
    ['incomplete', SubscriptionStatus.INCOMPLETE],
    ['active', SubscriptionStatus.ACTIVE],
    ['trialing', SubscriptionStatus.ACTIVE],
    ['past_due', SubscriptionStatus.PAST_DUE],
    ['unpaid', SubscriptionStatus.PAST_DUE],
    ['canceled', SubscriptionStatus.CANCELED],
    ['incomplete_expired', SubscriptionStatus.CANCELED],
  ] as const)('estado %s -> %s', (stripeStatus, expected) => {
    expect(toGatewaySubscription(stripeSub({ status: stripeStatus })).status).toBe(expected);
  });

  it('convierte el fin del periodo de segundos Unix a Date', () => {
    const result = toGatewaySubscription(stripeSub());
    expect(result.currentPeriodEnd).toEqual(new Date(1_800_000_000 * 1000));
    expect(result.subscriptionRef).toBe('sub_1');
    expect(result.customerRef).toBe('cus_1');
  });

  it('sin periodo informado, currentPeriodEnd es null', () => {
    expect(toGatewaySubscription(stripeSub({ items: undefined })).currentPeriodEnd).toBeNull();
  });

  it('un estado desconocido es un error de la pasarela', () => {
    expect(() => toGatewaySubscription(stripeSub({ status: 'rarisimo' as never }))).toThrow(PaymentProviderError);
  });
});

describe('StripePaymentAdapter con el simulador', () => {
  const setup = () => {
    const state = new PaymentSimulationState();
    const adapter = new StripePaymentAdapter(new FakeStripeApi(state));
    return { state, adapter };
  };
  const request = { userId: 'u1', email: 'a@b.co', idempotencyKey: 'k1' };

  it('crea la suscripción INCOMPLETE y entrega el client_secret ya extraído', async () => {
    const { adapter } = setup();
    const created = await adapter.createSubscription(request);
    expect(created.status).toBe(SubscriptionStatus.INCOMPLETE);
    expect(created.clientSecret).toMatch(/_secret_mock$/);
  });

  it('modo normal: al consultar queda ACTIVE con fecha de renovación', async () => {
    const { adapter } = setup();
    const created = await adapter.createSubscription(request);
    const state = await adapter.getSubscription(created.subscriptionRef);
    expect(state.status).toBe(SubscriptionStatus.ACTIVE);
    expect(state.currentPeriodEnd).toBeInstanceOf(Date);
  });

  it('modo declined: la tarjeta es rechazada y sigue INCOMPLETE', async () => {
    const { adapter, state } = setup();
    const created = await adapter.createSubscription(request);
    state.set('declined');
    expect((await adapter.getSubscription(created.subscriptionRef)).status).toBe(SubscriptionStatus.INCOMPLETE);
  });

  it('modo error: la pasarela caída se informa como PaymentProviderError', async () => {
    const { adapter, state } = setup();
    state.set('error');
    await expect(adapter.createSubscription(request)).rejects.toThrow(PaymentProviderError);
  });

  it('cancelar con refund devuelve el pago solo si se había cobrado', async () => {
    const { adapter } = setup();
    const paid = await adapter.createSubscription(request);
    await adapter.getSubscription(paid.subscriptionRef); // cobra
    expect(await adapter.cancelSubscription(paid.subscriptionRef, { refund: true })).toEqual({ canceled: true, refunded: true });

    const unpaid = await adapter.createSubscription(request);
    expect(await adapter.cancelSubscription(unpaid.subscriptionRef, { refund: true })).toEqual({ canceled: true, refunded: false });
  });

  it('webhook: traduce customer.subscription.updated y descarta otros eventos', async () => {
    const { adapter } = setup();
    const updated = JSON.stringify({ id: 'evt', type: 'customer.subscription.updated', data: { object: stripeSub({ status: 'past_due' }) } });
    const event = await adapter.parseWebhookEvent(updated, MOCK_WEBHOOK_SIGNATURE);
    expect(event?.subscription.status).toBe(SubscriptionStatus.PAST_DUE);

    const other = JSON.stringify({ id: 'evt2', type: 'charge.succeeded', data: { object: {} } });
    expect(await adapter.parseWebhookEvent(other, MOCK_WEBHOOK_SIGNATURE)).toBeNull();
  });
});
