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
