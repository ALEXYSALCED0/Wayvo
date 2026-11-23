import request from 'supertest';
import { buildContainer } from '../../src/infrastructure/container';
import { createApp } from '../../src/infrastructure/http/app';
import { MOCK_WEBHOOK_SIGNATURE } from '../../src/infrastructure/mock/fake-stripe.api';
import { SequentialIdGenerator, silentLogger, testConfig } from '../unit/helpers';

const BASE = '/api/v1/payments';
const as = (userId: string) => ({ 'x-user-id': userId });

function setup() {
  const container = buildContainer(testConfig(), { logger: silentLogger, ids: new SequentialIdGenerator() });
  const app = createApp(container, { nodeEnv: 'test' });
  return { app, container };
}

const create = (app: ReturnType<typeof setup>['app'], userId = 'user-1') =>
  request(app).post(`${BASE}/subscriptions`).set(as(userId)).send({ email: 'kes@example.com', name: 'Kes' });

describe('payment-service API', () => {
  it('GET /plan informa el plan PREMIUM de USD 4.95 al mes (sin identidad)', async () => {
    const { app } = setup();
    const res = await request(app).get(`${BASE}/plan`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ code: 'PREMIUM', amountCents: 495, currency: 'usd', interval: 'month' });
  });

  it('flujo feliz: crear -> confirmar -> la cuenta pasa a PREMIUM', async () => {
    const { app } = setup();

    const created = await create(app);
    expect(created.status).toBe(201);
    expect(created.body.data.subscription.status).toBe('INCOMPLETE');
    expect(created.body.data.clientSecret).toBeTruthy();

    const before = await request(app).get(`${BASE}/subscriptions/me`).set(as('user-1'));
    expect(before.body.data.plan).toBe('FREE');

    const id = created.body.data.subscription.id;
    const confirmed = await request(app).post(`${BASE}/subscriptions/${id}/confirm`).set(as('user-1'));
    expect(confirmed.status).toBe(200);
    expect(confirmed.body.data.status).toBe('ACTIVE');
    expect(confirmed.body.data.currentPeriodEnd).toBeTruthy();

    const after = await request(app).get(`${BASE}/subscriptions/me`).set(as('user-1'));
    expect(after.body.data.plan).toBe('PREMIUM');
  });

  it('tarjeta rechazada: confirmar devuelve INCOMPLETE y la cuenta sigue FREE', async () => {
    const { app, container } = setup();
    const id = (await create(app)).body.data.subscription.id;
    container.simulation!.set('declined');

    const confirmed = await request(app).post(`${BASE}/subscriptions/${id}/confirm`).set(as('user-1'));
    expect(confirmed.status).toBe(200);
    expect(confirmed.body.data.status).toBe('INCOMPLETE');
    expect((await request(app).get(`${BASE}/subscriptions/me`).set(as('user-1'))).body.data.plan).toBe('FREE');
  });

  it('pasarela caída: 502 PAYMENT_PROVIDER_ERROR y no se guarda nada', async () => {
    const { app, container } = setup();
    container.simulation!.set('error');

    const res = await create(app);
    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('PAYMENT_PROVIDER_ERROR');
    expect((await request(app).get(`${BASE}/subscriptions/me`).set(as('user-1'))).body.data.subscription).toBeNull();
  });

  it('no permite dos suscripciones activas: 409', async () => {
    const { app } = setup();
    const id = (await create(app)).body.data.subscription.id;
    await request(app).post(`${BASE}/subscriptions/${id}/confirm`).set(as('user-1'));

    const again = await create(app);
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('ALREADY_SUBSCRIBED');
  });

  it('un intento sin pagar se reemplaza por uno nuevo y el anterior queda cancelado', async () => {
    const { app } = setup();
    const first = (await create(app)).body.data.subscription.id;
    const second = (await create(app)).body.data.subscription.id;
    expect(second).not.toBe(first);

    const old = await request(app).post(`${BASE}/subscriptions/${first}/cancel`).set(as('user-1')).send({});
    expect(old.body.data.subscription.status).toBe('CANCELED');
  });

  it('compensación: cancelar con refund devuelve el pago y la cuenta vuelve a FREE', async () => {
    const { app } = setup();
    const id = (await create(app)).body.data.subscription.id;
    await request(app).post(`${BASE}/subscriptions/${id}/confirm`).set(as('user-1'));

    const res = await request(app).post(`${BASE}/subscriptions/${id}/cancel`).set(as('user-1')).send({ refund: true });
    expect(res.status).toBe(200);
    expect(res.body.data.refunded).toBe(true);
    expect(res.body.data.subscription.status).toBe('CANCELED');
    expect((await request(app).get(`${BASE}/subscriptions/me`).set(as('user-1'))).body.data.plan).toBe('FREE');
  });

  it('cancelar dos veces es seguro (idempotente)', async () => {
    const { app } = setup();
    const id = (await create(app)).body.data.subscription.id;
    await request(app).post(`${BASE}/subscriptions/${id}/cancel`).set(as('user-1')).send({});
    const again = await request(app).post(`${BASE}/subscriptions/${id}/cancel`).set(as('user-1')).send({ refund: true });
    expect(again.status).toBe(200);
    expect(again.body.data.refunded).toBe(false);
  });

  it('un usuario no puede ver, confirmar ni cancelar la suscripción de otro (404)', async () => {
    const { app } = setup();
    const id = (await create(app, 'user-1')).body.data.subscription.id;

    expect((await request(app).post(`${BASE}/subscriptions/${id}/confirm`).set(as('user-2'))).status).toBe(404);
    expect((await request(app).post(`${BASE}/subscriptions/${id}/cancel`).set(as('user-2')).send({})).status).toBe(404);
    expect((await request(app).get(`${BASE}/subscriptions/me`).set(as('user-2'))).body.data.plan).toBe('FREE');
  });

  it('sin x-user-id responde 401 y el userId del cuerpo se ignora', async () => {
    const { app } = setup();
    const noIdentity = await request(app).post(`${BASE}/subscriptions`).send({ email: 'a@b.co' });
    expect(noIdentity.status).toBe(401);

    const spoofed = await request(app).post(`${BASE}/subscriptions`).set(as('user-1')).send({ email: 'a@b.co', userId: 'user-9' });
    expect(spoofed.status).toBe(201);
    expect((await request(app).get(`${BASE}/subscriptions/me`).set(as('user-9'))).body.data.subscription).toBeNull();
  });

  it('valida el correo: 400', async () => {
    const { app } = setup();
    const res = await request(app).post(`${BASE}/subscriptions`).set(as('user-1')).send({ email: 'no-es-un-correo' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  describe('webhook', () => {
    const event = (status: string, subscriptionId: string) =>
      JSON.stringify({ id: 'evt_1', type: 'customer.subscription.updated', data: { object: { id: subscriptionId, customer: 'cus', status, cancel_at_period_end: false } } });

    it('un cobro fallido de la renovación deja la cuenta en FREE', async () => {
      const { app } = setup();
      const id = (await create(app)).body.data.subscription.id;
      await request(app).post(`${BASE}/subscriptions/${id}/confirm`).set(as('user-1'));
      expect((await request(app).get(`${BASE}/subscriptions/me`).set(as('user-1'))).body.data.plan).toBe('PREMIUM');

      const res = await request(app)
        .post(`${BASE}/webhook`)
        .set('stripe-signature', MOCK_WEBHOOK_SIGNATURE)
        .set('content-type', 'application/json')
        .send(event('past_due', 'sub_mock_2'));
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ received: true, updated: true });
      expect((await request(app).get(`${BASE}/subscriptions/me`).set(as('user-1'))).body.data.plan).toBe('FREE');
    });

    it('firma inválida: 400 y no se procesa', async () => {
      const { app } = setup();
      const res = await request(app)
        .post(`${BASE}/webhook`)
        .set('stripe-signature', 'falsa')
        .set('content-type', 'application/json')
        .send(event('active', 'sub_mock_2'));
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_WEBHOOK_SIGNATURE');
    });

    it('un evento de una suscripción desconocida se acepta sin cambiar nada', async () => {
      const { app } = setup();
      const res = await request(app)
        .post(`${BASE}/webhook`)
        .set('stripe-signature', MOCK_WEBHOOK_SIGNATURE)
        .set('content-type', 'application/json')
        .send(event('active', 'sub_desconocida'));
      expect(res.status).toBe(200);
      expect(res.body.data.updated).toBe(false);
    });
  });

  describe('simulador de fallos', () => {
    it('se cambia en caliente con GET /api/v1/mock/simulate-payment', async () => {
      const { app } = setup();
      const set = await request(app).get('/api/v1/mock/simulate-payment?mode=declined');
      expect(set.body.data.mode).toBe('declined');
      expect((await request(app).get('/api/v1/mock/simulate-payment?mode=raro')).status).toBe(400);
      expect((await request(app).get('/api/v1/mock/simulate-payment')).body.data.mode).toBe('declined');
    });

    it('no existe en producción', async () => {
      const container = buildContainer(testConfig(), { logger: silentLogger });
      const app = createApp(container, { nodeEnv: 'production' });
      expect((await request(app).get('/api/v1/mock/simulate-payment')).status).toBe(404);
    });
  });
});
