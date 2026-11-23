import request from 'supertest';
import { loadConfig } from '../../../src/infrastructure/config/env';
import { buildContainer } from '../../../src/infrastructure/container';
import { createApp } from '../../../src/infrastructure/http/app';
import { InMemoryUserRepository } from '../../../src/infrastructure/persistence/in-memory-user.repository';
import { FakePasswordHasher, silentLogger, testTokens } from '../../unit/helpers';

// App completa (rutas + middlewares + casos de uso) con repositorio en memoria.
function buildTestApp() {
  const container = buildContainer(loadConfig({ NODE_ENV: 'test' }), silentLogger, {
    users: new InMemoryUserRepository(),
    hasher: new FakePasswordHasher(),
    tokens: testTokens(),
  });
  return createApp(container);
}

const ana = { name: 'Ana', email: 'ana@correo.com', password: 'clave-segura-1' };

describe('Rutas HTTP de auth-service', () => {
  it('POST /register → 201 con token y usuario sin contraseña', async () => {
    const res = await request(buildTestApp()).post('/api/v1/auth/register').send(ana);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user).toEqual(expect.objectContaining({ email: 'ana@correo.com', role: 'TRAVELER' }));
    expect(JSON.stringify(res.body)).not.toContain('clave-segura-1');
  });

  it('POST /register con datos inválidos → 400 con el campo que falla', async () => {
    const res = await request(buildTestApp())
      .post('/api/v1/auth/register')
      .send({ ...ana, password: 'corta' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0].path).toBe('password');
  });

  it('POST /register con correo repetido → 409', async () => {
    const app = buildTestApp();
    await request(app).post('/api/v1/auth/register').send(ana);

    const res = await request(app).post('/api/v1/auth/register').send(ana);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_ALREADY_REGISTERED');
  });

  it('POST /login → 200 con credenciales correctas y 401 con incorrectas', async () => {
    const app = buildTestApp();
    await request(app).post('/api/v1/auth/register').send(ana);

    const ok = await request(app).post('/api/v1/auth/login').send({ email: ana.email, password: ana.password });
    const bad = await request(app).post('/api/v1/auth/login').send({ email: ana.email, password: 'equivocada' });

    expect(ok.status).toBe(200);
    expect(ok.body.data.token).toEqual(expect.any(String));
    expect(bad.status).toBe(401);
    expect(bad.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('GET /me → 200 con Bearer token válido, 401 sin token', async () => {
    const app = buildTestApp();
    const { body } = await request(app).post('/api/v1/auth/register').send(ana);

    const ok = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${body.data.token}`);
    const noToken = await request(app).get('/api/v1/auth/me');

    expect(ok.status).toBe(200);
    expect(ok.body.data.email).toBe('ana@correo.com');
    expect(noToken.status).toBe(401);
    expect(noToken.body.error.code).toBe('INVALID_TOKEN');
  });

  it('GET /health → 200', async () => {
    const res = await request(buildTestApp()).get('/health');
    expect(res.body.data.service).toBe('auth-service');
  });
});

describe('Rutas internas: plan de la cuenta', () => {
  const TOKEN = 'wayvo-dev-internal-token-cambiar-en-produccion';

  async function registerAna(app: ReturnType<typeof buildTestApp>) {
    const res = await request(app).post('/api/v1/auth/register').send(ana);
    return { id: res.body.data.user.id as string, token: res.body.data.token as string };
  }

  it('sin token interno → 401 INVALID_INTERNAL_TOKEN', async () => {
    const app = buildTestApp();
    const { id } = await registerAna(app);

    const res = await request(app).put(`/api/v1/internal/users/${id}/plan`).send({ plan: 'FREE' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_INTERNAL_TOKEN');
  });

  it('el JWT de un usuario NO sirve para cambiarse el plan', async () => {
    const app = buildTestApp();
    const { id, token } = await registerAna(app);

    const res = await request(app)
      .put(`/api/v1/internal/users/${id}/plan`)
      .set('authorization', `Bearer ${token}`)
      .send({ plan: 'PREMIUM', subscriptionId: 'sub_1' });

    expect(res.status).toBe(401);
  });

  it('con token interno sube a PREMIUM y /auth/me lo refleja; luego baja a FREE', async () => {
    const app = buildTestApp();
    const { id, token } = await registerAna(app);

    const up = await request(app)
      .put(`/api/v1/internal/users/${id}/plan`)
      .set('x-internal-token', TOKEN)
      .send({ plan: 'PREMIUM', subscriptionId: 'sub_1', currentPeriodEnd: '2026-12-23T00:00:00.000Z' });
    expect(up.status).toBe(200);
    expect(up.body.data.plan).toBe('PREMIUM');

    const me = await request(app).get('/api/v1/auth/me').set('authorization', `Bearer ${token}`);
    expect(me.body.data.plan).toBe('PREMIUM');
    expect(me.body.data.planExpiresAt).toBe('2026-12-23T00:00:00.000Z');

    const down = await request(app)
      .put(`/api/v1/internal/users/${id}/plan`)
      .set('x-internal-token', TOKEN)
      .send({ plan: 'FREE' });
    expect(down.body.data.plan).toBe('FREE');
  });

  it('PREMIUM sin suscripción → 422; usuario inexistente → 404; plan inválido → 400', async () => {
    const app = buildTestApp();
    const { id } = await registerAna(app);
    const put = (uid: string, body: object) =>
      request(app).put(`/api/v1/internal/users/${uid}/plan`).set('x-internal-token', TOKEN).send(body);

    expect((await put(id, { plan: 'PREMIUM' })).status).toBe(422);
    expect((await put('no-existe', { plan: 'FREE' })).status).toBe(404);
    expect((await put(id, { plan: 'GOLD' })).status).toBe(400);
  });
});

describe('Rutas internas: cuota de planes de IA y /auth/me', () => {
  const TOKEN = 'wayvo-dev-internal-token-cambiar-en-produccion';

  async function registerAna(app: ReturnType<typeof buildTestApp>) {
    const res = await request(app).post('/api/v1/auth/register').send(ana);
    return { id: res.body.data.user.id as string, token: res.body.data.token as string };
  }
  const consume = (app: ReturnType<typeof buildTestApp>, id: string, body: object = {}) =>
    request(app).post(`/api/v1/internal/users/${id}/ai-plans/consume`).set('x-internal-token', TOKEN).send(body);

  it('exige el token interno', async () => {
    const app = buildTestApp();
    const { id } = await registerAna(app);

    const res = await request(app).post(`/api/v1/internal/users/${id}/ai-plans/consume`).send({});

    expect(res.status).toBe(401);
  });

  it('consume descuenta un plan, release lo devuelve, y /auth/me muestra el uso', async () => {
    const app = buildTestApp();
    const { id, token } = await registerAna(app);

    const used = await consume(app, id, { budgetCategory: 'Estándar' });
    expect(used.body.data).toMatchObject({ allowed: true, counted: true });
    expect(used.body.data.entitlements.aiPlans).toMatchObject({ used: 1, remaining: 4, limit: 5 });

    const me = await request(app).get('/api/v1/auth/me').set('authorization', `Bearer ${token}`);
    expect(me.body.data.entitlements).toMatchObject({ plan: 'FREE', luxuryBudget: false });
    expect(me.body.data.entitlements.aiPlans.used).toBe(1);

    const released = await request(app)
      .post(`/api/v1/internal/users/${id}/ai-plans/release`)
      .set('x-internal-token', TOKEN)
      .send({ period: used.body.data.entitlements.aiPlans.period });
    expect(released.body.data.entitlements.aiPlans.used).toBe(0);
  });

  it('FREE: Lujo se rechaza y el sexto plan también; PREMIUM puede todo', async () => {
    const app = buildTestApp();
    const { id } = await registerAna(app);

    const luxury = await consume(app, id, { budgetCategory: 'Lujo' });
    expect(luxury.status).toBe(200);
    expect(luxury.body.data).toMatchObject({ allowed: false, code: 'LUXURY_BUDGET_REQUIRES_PREMIUM' });

    for (let i = 0; i < 5; i++) await consume(app, id, { budgetCategory: 'Estándar' });
    const sixth = await consume(app, id, { budgetCategory: 'Estándar' });
    expect(sixth.body.data).toMatchObject({ allowed: false, code: 'AI_PLAN_LIMIT_REACHED' });

    await request(app)
      .put(`/api/v1/internal/users/${id}/plan`)
      .set('x-internal-token', TOKEN)
      .send({ plan: 'PREMIUM', subscriptionId: 'sub_1' });
    const premium = await consume(app, id, { budgetCategory: 'Lujo' });
    expect(premium.body.data).toMatchObject({ allowed: true, counted: false });
  });

  it('usuario inexistente → 404', async () => {
    expect((await consume(buildTestApp(), 'nadie')).status).toBe(404);
  });
});
