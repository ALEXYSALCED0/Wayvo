import { InvalidWebhookSignatureError, PaymentProviderError } from '../../src/adapters/payment/errors';
import { STRIPE_API_VERSION, StripeHttpApi } from '../../src/infrastructure/stripe/stripe-http.api';
import { signStripePayload } from '../../src/infrastructure/stripe/webhook-signature';

interface Call { url: string; init: RequestInit }

function fakeFetch(responses: Array<{ status?: number; body: unknown } | Error>) {
  const calls: Call[] = [];
  const impl = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    const next = responses.shift();
    if (!next) throw new Error('unexpected extra call');
    if (next instanceof Error) throw next;
    return new Response(JSON.stringify(next.body), { status: next.status ?? 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
  return { impl, calls };
}

const SECRET_KEY = 'sk_test_supersecreta';
const make = (fetchImpl: typeof fetch, extra: Partial<ConstructorParameters<typeof StripeHttpApi>[0]> = {}) =>
  new StripeHttpApi({ secretKey: SECRET_KEY, priceId: 'price_495', timeoutMs: 1000, fetchImpl, ...extra });

describe('StripeHttpApi', () => {
  it('crea la suscripción con default_incomplete, el precio, la versión fijada y el expand correcto', async () => {
    const { impl, calls } = fakeFetch([{ body: { id: 'sub_1', customer: 'cus_1', status: 'incomplete', cancel_at_period_end: false } }]);
    await make(impl).createSubscription({ customerId: 'cus_1', userId: 'u1', idempotencyKey: 'k:sub' });

    const { url, init } = calls[0];
    const headers = init.headers as Record<string, string>;
    const body = decodeURIComponent(String(init.body));
    expect(url).toBe('https://api.stripe.com/v1/subscriptions');
    expect(headers['Stripe-Version']).toBe(STRIPE_API_VERSION);
    expect(headers.Authorization).toBe(`Bearer ${SECRET_KEY}`);
    expect(headers['Idempotency-Key']).toBe('k:sub');
    expect(body).toContain('customer=cus_1');
    expect(body).toContain('items[0][price]=price_495');
    expect(body).toContain('payment_behavior=default_incomplete');
    expect(body).toContain('expand[0]=latest_invoice.confirmation_secret');
    expect(body).toContain('metadata[userId]=u1');
  });

  it('cancelar usa DELETE sobre la suscripción', async () => {
    const { impl, calls } = fakeFetch([{ body: { id: 'sub_1', customer: 'cus_1', status: 'canceled', cancel_at_period_end: false } }]);
    await make(impl).cancelSubscription('sub_1');
    expect(calls[0].init.method).toBe('DELETE');
    expect(calls[0].url).toBe('https://api.stripe.com/v1/subscriptions/sub_1');
  });

  it('devolver el pago: busca el payment_intent pagado y crea el refund', async () => {
    const { impl, calls } = fakeFetch([
      { body: { latest_invoice: { payments: { data: [{ status: 'paid', payment: { type: 'payment_intent', payment_intent: 'pi_1' } }] } } } },
      { body: { id: 're_1' } },
    ]);
    expect(await make(impl).refundLatestPayment('sub_1')).toBe(true);
    expect(calls[0].url).toContain('expand%5B0%5D=latest_invoice.payments');
    expect(calls[1].url).toBe('https://api.stripe.com/v1/refunds');
    expect(decodeURIComponent(String(calls[1].init.body))).toContain('payment_intent=pi_1');
  });

  it('devolver el pago: si no hubo cobro, no crea refund', async () => {
    const { impl, calls } = fakeFetch([{ body: { latest_invoice: { payments: { data: [] } } } }]);
    expect(await make(impl).refundLatestPayment('sub_1')).toBe(false);
    expect(calls).toHaveLength(1);
  });

  it('un error de Stripe se convierte en PaymentProviderError SIN exponer la clave', async () => {
    const { impl } = fakeFetch([{ status: 401, body: { error: { message: 'Invalid API Key provided' } } }]);
    const error = await make(impl).retrieveSubscription('sub_1').catch((e: Error) => e);
    expect(error).toBeInstanceOf(PaymentProviderError);
    expect((error as PaymentProviderError).status).toBe(401);
    expect((error as Error).message).not.toContain(SECRET_KEY);
  });

  it('un fallo de red es PaymentProviderError sin detalles internos', async () => {
    const { impl } = fakeFetch([new TypeError(`fetch failed for ${SECRET_KEY}`)]);
    const error = await make(impl).retrieveSubscription('sub_1').catch((e: Error) => e);
    expect(error).toBeInstanceOf(PaymentProviderError);
    expect((error as Error).message).not.toContain(SECRET_KEY);
  });

  it('un timeout se informa como tal', async () => {
    const timeout = Object.assign(new Error('aborted'), { name: 'TimeoutError' });
    const { impl } = fakeFetch([timeout]);
    await expect(make(impl).retrieveSubscription('sub_1')).rejects.toThrow(/did not respond within 1000 ms/);
  });

  describe('webhook', () => {
    const body = JSON.stringify({ id: 'evt_1', type: 'customer.subscription.updated', data: { object: { id: 'sub_1' } } });

    it('acepta una firma válida y devuelve el evento', () => {
      const api = make(fakeFetch([]).impl, { webhookSecret: 'whsec_x' });
      const header = signStripePayload(body, 'whsec_x', Math.floor(Date.now() / 1000));
      expect(api.constructWebhookEvent(body, header).type).toBe('customer.subscription.updated');
    });

    it('rechaza una firma inválida', () => {
      const api = make(fakeFetch([]).impl, { webhookSecret: 'whsec_x' });
      expect(() => api.constructWebhookEvent(body, `t=${Math.floor(Date.now() / 1000)},v1=${'a'.repeat(64)}`)).toThrow(InvalidWebhookSignatureError);
    });

    it('sin STRIPE_WEBHOOK_SECRET no procesa webhooks', () => {
      expect(() => make(fakeFetch([]).impl).constructWebhookEvent(body, 'x')).toThrow(/STRIPE_WEBHOOK_SECRET/);
    });
  });
});
