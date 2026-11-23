import request from 'supertest';
import { StripePaymentAdapter } from '../../src/adapters/payment/stripe.adapter';
import { PaymentProviderError } from '../../src/adapters/payment/errors';
import { buildContainer } from '../../src/infrastructure/container';
import { createApp } from '../../src/infrastructure/http/app';
import { MOCK_WEBHOOK_SIGNATURE, FakeStripeApi } from '../../src/infrastructure/mock/fake-stripe.api';
import { PaymentSimulationState } from '../../src/infrastructure/mock/simulation-state';
import { SequentialIdGenerator, silentLogger, testConfig } from '../unit/helpers';

const BASE = '/api/v1/payments';
const as = (userId: string) => ({ 'x-user-id': userId });

function setup() {
  const container = buildContainer(testConfig(), { logger: silentLogger, ids: new SequentialIdGenerator() });
  const app = createApp(container, { nodeEnv: 'test' });
  return { app, container, accounts: container.simulatedAccounts!, simulation: container.simulation! };
}

type App = ReturnType<typeof setup>['app'];
const create = (app: App, userId = 'user-1') =>
  request(app).post(`${BASE}/subscriptions`).set(as(userId)).send({ email: 'kes@example.com' });
const activate = (app: App, id: string, userId = 'user-1') =>
  request(app).post(`${BASE}/subscriptions/${id}/activate`).set(as(userId));
const idOf = (res: request.Response) => res.body.data.subscription.id as string;

describe('Saga de activación de la suscripción', () => {
  it('camino feliz: confirma el pago, activa PREMIUM en la cuenta y responde 200', async () => {
    const { app, accounts } = setup();
    const id = idOf(await create(app));

    const res = await activate(app, id);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'ACTIVATED', plan: 'PREMIUM', failedStep: null, refunded: false });
    expect(res.body.data.subscription.status).toBe('ACTIVE');
    expect(res.body.data.steps.map((s: { step: string; outcome: string }) => [s.step, s.outcome])).toEqual([
      ['CONFIRM_PAYMENT', 'SUCCEEDED'],
      ['ACTIVATE_PLAN', 'SUCCEEDED'],
    ]);
    expect(accounts.planOf('user-1')).toBe('PREMIUM');
    expect(accounts.calls[0]).toMatchObject({ userId: 'user-1', plan: 'PREMIUM', subscriptionId: id });
    expect(accounts.calls[0].currentPeriodEnd).toBeInstanceOf(Date);
  });

  it('tarjeta rechazada: 402, no se cobró nada, la cuenta no cambia y se puede reintentar', async () => {
    const { app, accounts, simulation } = setup();
    const id = idOf(await create(app));
    simulation.set('declined');

    const res = await activate(app, id);

    expect(res.status).toBe(402);
    expect(res.body.error.code).toBe('PAYMENT_NOT_COMPLETED');
    expect(res.body.error.details).toMatchObject({ status: 'PAYMENT_PENDING', plan: 'FREE', refunded: false });
    expect(accounts.calls).toHaveLength(0);
    // No hay nada que compensar: la suscripción sigue pendiente para reintentar el pago.
    expect(res.body.error.details.subscription.status).toBe('INCOMPLETE');

    simulation.set('normal');
    const retry = await activate(app, id);
    expect(retry.status).toBe(200);
    expect(accounts.planOf('user-1')).toBe('PREMIUM');
  });

  it('COMPENSACIÓN: se cobró pero la cuenta falla -> se cancela la suscripción y se devuelve el pago', async () => {
    const { app, accounts, simulation } = setup();
    const id = idOf(await create(app));
    simulation.activationFails = true;

    const res = await activate(app, id);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('SAGA_COMPENSATED');
    expect(res.body.error.details).toMatchObject({
      status: 'COMPENSATED',
      plan: 'FREE',
      failedStep: 'ACTIVATE_PLAN',
      refunded: true,
    });
    expect(res.body.error.details.subscription.status).toBe('CANCELED');
    expect(res.body.error.details.steps.map((s: { step: string; outcome: string }) => [s.step, s.outcome])).toEqual([
      ['CONFIRM_PAYMENT', 'SUCCEEDED'],
      ['ACTIVATE_PLAN', 'FAILED'],
      ['COMPENSATE_SUBSCRIPTION', 'SUCCEEDED'],
    ]);
    expect(accounts.planOf('user-1')).toBe('FREE');
    expect((await request(app).get(`${BASE}/subscriptions/me`).set(as('user-1'))).body.data.plan).toBe('FREE');
  });

  it('la compensación no intenta tocar la cuenta (que es justo lo que falló)', async () => {
    const { app, accounts, simulation } = setup();
    const id = idOf(await create(app));
    simulation.activationFails = true;

    await activate(app, id);

    // Una sola llamada a la cuenta: la de activar. Ninguna de "volver a FREE".
    expect(accounts.calls.map((c) => c.plan)).toEqual(['PREMIUM']);
  });

  it('si la compensación también falla: 500 COMPENSATION_FAILED (hay que devolver el pago a mano)', async () => {
    const simulation = new PaymentSimulationState();
    class BrokenCancelAdapter extends StripePaymentAdapter {
      override async cancelSubscription(): Promise<never> {
        throw new PaymentProviderError('Stripe down during compensation');
      }
    }
    const container = buildContainer(testConfig(), {
      logger: silentLogger,
      ids: new SequentialIdGenerator(),
      gateway: new BrokenCancelAdapter(new FakeStripeApi(simulation)),
    });
    const app = createApp(container, { nodeEnv: 'test' });
    const id = idOf(await create(app));
    container.simulation!.activationFails = true;
    // El estado de simulación del Fake es otro objeto: el pago entra con normalidad.

    const res = await activate(app, id);

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('COMPENSATION_FAILED');
    expect(res.body.error.details.steps.at(-1)).toMatchObject({ step: 'COMPENSATE_SUBSCRIPTION', outcome: 'FAILED' });
  });

  it('la pasarela cae al confirmar el pago: 502 y no se toca la cuenta', async () => {
    const { app, accounts, simulation } = setup();
    const id = idOf(await create(app));
    simulation.set('error');

    const res = await activate(app, id);

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('PAYMENT_PROVIDER_ERROR');
    expect(accounts.calls).toHaveLength(0);
  });

  it('activar dos veces es seguro (idempotente)', async () => {
    const { app, accounts } = setup();
    const id = idOf(await create(app));

    expect((await activate(app, id)).status).toBe(200);
    expect((await activate(app, id)).status).toBe(200);
    expect(accounts.planOf('user-1')).toBe('PREMIUM');
  });

  it('no se puede activar la suscripción de otro usuario (404)', async () => {
    const { app, accounts } = setup();
    const id = idOf(await create(app, 'user-1'));

    const res = await activate(app, id, 'user-2');

    expect(res.status).toBe(404);
    expect(accounts.calls).toHaveLength(0);
  });
});

describe('El plan de la cuenta sigue a la suscripción', () => {
  it('cancelar una suscripción activa devuelve la cuenta a FREE', async () => {
    const { app, accounts } = setup();
    const id = idOf(await create(app));
    await activate(app, id);
    expect(accounts.planOf('user-1')).toBe('PREMIUM');

    const res = await request(app).post(`${BASE}/subscriptions/${id}/cancel`).set(as('user-1')).send({});

    expect(res.status).toBe(200);
    expect(accounts.planOf('user-1')).toBe('FREE');
  });

  it('cancelar un intento sin pagar no toca la cuenta', async () => {
    const { app, accounts } = setup();
    const id = idOf(await create(app));

    await request(app).post(`${BASE}/subscriptions/${id}/cancel`).set(as('user-1')).send({});

    expect(accounts.calls).toHaveLength(0);
  });

  describe('webhook', () => {
    const event = (status: string, ref: string, type = 'customer.subscription.updated') =>
      JSON.stringify({ id: 'evt', type, data: { object: { id: ref, customer: 'cus', status, cancel_at_period_end: false } } });
    const send = (app: App, body: string) =>
      request(app).post(`${BASE}/webhook`).set('stripe-signature', MOCK_WEBHOOK_SIGNATURE).set('content-type', 'application/json').send(body);

    it('un cobro fallido en la renovación quita PREMIUM a la cuenta', async () => {
      const { app, accounts } = setup();
      const id = idOf(await create(app));
      await activate(app, id);

      const res = await send(app, event('past_due', 'sub_mock_2'));

      expect(res.status).toBe(200);
      expect(accounts.planOf('user-1')).toBe('FREE');
    });

    it('una cancelación hecha desde Stripe también la deja en FREE', async () => {
      const { app, accounts } = setup();
      const id = idOf(await create(app));
      await activate(app, id);

      await send(app, event('canceled', 'sub_mock_2', 'customer.subscription.deleted'));

      expect(accounts.planOf('user-1')).toBe('FREE');
    });

    it('un evento atrasado de una suscripción vieja NO quita el plan a la nueva', async () => {
      const { app, accounts } = setup();
      const first = idOf(await create(app)); // sub_mock_2, sin pagar
      const second = idOf(await create(app)); // reemplaza a la anterior: sub_mock_4
      await activate(app, second);
      expect(first).not.toBe(second);
      expect(accounts.planOf('user-1')).toBe('PREMIUM');

      await send(app, event('canceled', 'sub_mock_2', 'customer.subscription.deleted'));

      expect(accounts.planOf('user-1')).toBe('PREMIUM');
    });

    it('si la cuenta falla, responde 502 para que Stripe reintente el webhook', async () => {
      const { app, simulation } = setup();
      const id = idOf(await create(app));
      await activate(app, id);
      simulation.activationFails = true;

      const res = await send(app, event('past_due', 'sub_mock_2'));

      expect(res.status).toBe(502);
      expect(res.body.error.code).toBe('ACCOUNT_SERVICE_ERROR');
    });
  });

  it('el simulador permite provocar el fallo de activación', async () => {
    const { app, simulation } = setup();
    expect((await request(app).get('/api/v1/mock/simulate-payment?activation=fail')).body.data.activation).toBe('fail');
    expect(simulation.activationFails).toBe(true);
    expect((await request(app).get('/api/v1/mock/simulate-payment?activation=ok')).body.data.activation).toBe('ok');
    expect((await request(app).get('/api/v1/mock/simulate-payment?activation=quizas')).status).toBe(400);
  });
});
