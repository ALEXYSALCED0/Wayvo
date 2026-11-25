import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import { AccountPlan, AiPlanDenialCode, BudgetCategory } from '@wayvo/contracts';
import { createApp } from '../src/infrastructure/http/app';
import { TripFacade } from '../src/application/facades/trip.facade';
import { AiServicePort } from '../src/application/ports/ai-service.port';
import { BookingServicePort } from '../src/application/ports/booking-service.port';
import { HttpAiPlanQuotaGateway } from '../src/adapters/gateways/http-ai-plan-quota.gateway';
import { authHeader } from './auth-helpers';
import { entitlementsOf, quotaReturning } from './quota-helpers';

const planInput = {
  origin: 'Barranquilla',
  destination: 'Medellín',
  startDate: '2026-11-15',
  endDate: '2026-11-20',
  travelers: 1,
  budgetCategory: BudgetCategory.ESTANDAR,
  currency: 'COP',
  psychologicalAssessment: {
    spontaneityScore: 3,
    comfortPriority: 3,
    culturalCuriosity: 3,
    socialPreference: 'solo',
    physicalActivityLevel: 'moderate',
    interests: [],
  },
};

function buildApp(quota: ReturnType<typeof quotaReturning>, generatePlan = vi.fn().mockResolvedValue({ planId: 'p1' })) {
  const ai: AiServicePort = { generatePlan };
  const booking: BookingServicePort = { executeConfirmTripSaga: vi.fn() };
  return { app: createApp({ tripFacade: new TripFacade(ai, booking), aiPlanQuota: quota }), generatePlan };
}

const free = (used: number) => entitlementsOf(AccountPlan.FREE, used);

describe('Cuota de planes con IA en el gateway', () => {
  it('FREE con cupo: genera el plan, consulta con el usuario del TOKEN y no devuelve nada', async () => {
    const quota = quotaReturning({ allowed: true, counted: true, entitlements: free(1) });
    const { app, generatePlan } = buildApp(quota);

    const res = await request(app)
      .post('/api/v1/trips/plan')
      .set('Authorization', authHeader('usr-ana'))
      .send({ ...planInput, userId: 'usr-victima' });

    expect(res.status).toBe(200);
    expect(generatePlan).toHaveBeenCalledTimes(1);
    expect(quota.consume).toHaveBeenCalledWith('usr-ana', 'Estándar', expect.any(String));
    expect(quota.release).not.toHaveBeenCalled();
  });

  it('FREE sin planes este mes: 403 AI_PLAN_LIMIT_REACHED con los datos para el aviso, y la IA ni se llama', async () => {
    const quota = quotaReturning({
      allowed: false,
      counted: false,
      code: AiPlanDenialCode.LIMIT_REACHED,
      message: 'Ya usaste tus 5 planes de IA de este mes',
      entitlements: free(5),
    });
    const { app, generatePlan } = buildApp(quota);

    const res = await request(app).post('/api/v1/trips/plan').set('Authorization', authHeader('usr-ana')).send(planInput);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('AI_PLAN_LIMIT_REACHED');
    expect(res.body.error.details.aiPlans).toMatchObject({ limit: 5, used: 5, remaining: 0, resetsAt: '2026-12-01T05:00:00.000Z' });
    expect(generatePlan).not.toHaveBeenCalled();
  });

  it('FREE con presupuesto Lujo: 403 LUXURY_BUDGET_REQUIRES_PREMIUM', async () => {
    const quota = quotaReturning({
      allowed: false,
      counted: false,
      code: AiPlanDenialCode.LUXURY_REQUIRES_PREMIUM,
      message: 'El presupuesto de lujo es solo para cuentas PREMIUM',
      entitlements: free(0),
    });
    const { app, generatePlan } = buildApp(quota);

    const res = await request(app)
      .post('/api/v1/trips/plan')
      .set('Authorization', authHeader('usr-ana'))
      .send({ ...planInput, budgetCategory: BudgetCategory.LUJO });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('LUXURY_BUDGET_REQUIRES_PREMIUM');
    expect(quota.consume).toHaveBeenCalledWith('usr-ana', 'Lujo', expect.any(String));
    expect(generatePlan).not.toHaveBeenCalled();
  });

  it('si la IA falla, se devuelve el plan descontado', async () => {
    const quota = quotaReturning({ allowed: true, counted: true, entitlements: free(1) });
    const { app } = buildApp(quota, vi.fn().mockRejectedValue(new Error('IA caída')));

    const res = await request(app).post('/api/v1/trips/plan').set('Authorization', authHeader('usr-ana')).send(planInput);

    expect(res.status).toBeGreaterThanOrEqual(500);
    await vi.waitFor(() => expect(quota.release).toHaveBeenCalledWith('usr-ana', '2026-11', expect.any(String)));
  });

  it('si los datos son inválidos (la petición falla), también se devuelve el plan', async () => {
    const quota = quotaReturning({ allowed: true, counted: true, entitlements: free(1) });
    const { app } = buildApp(quota);

    const res = await request(app)
      .post('/api/v1/trips/plan')
      .set('Authorization', authHeader('usr-ana'))
      .send({ ...planInput, travelers: -3 });

    expect(res.status).toBeGreaterThanOrEqual(400);
    await vi.waitFor(() => expect(quota.release).toHaveBeenCalledTimes(1));
  });

  it('PREMIUM (counted=false): nunca se devuelve nada aunque falle', async () => {
    const quota = quotaReturning({ allowed: true, counted: false, entitlements: entitlementsOf(AccountPlan.PREMIUM) });
    const { app } = buildApp(quota, vi.fn().mockRejectedValue(new Error('IA caída')));

    await request(app).post('/api/v1/trips/plan').set('Authorization', authHeader('usr-pro')).send(planInput);
    await new Promise((r) => setTimeout(r, 20));

    expect(quota.release).not.toHaveBeenCalled();
  });

  it('el acceso directo POST /api/v1/ai/plan también pasa por la cuota (no es una puerta trasera)', async () => {
    const quota = quotaReturning({
      allowed: false,
      counted: false,
      code: AiPlanDenialCode.LUXURY_REQUIRES_PREMIUM,
      entitlements: free(0),
    });
    const { app } = buildApp(quota);

    const res = await request(app)
      .post('/api/v1/ai/plan')
      .set('Authorization', authHeader('usr-ana'))
      .send({ ...planInput, budgetCategory: 'Lujo' });

    expect(res.status).toBe(403);
    expect(quota.consume).toHaveBeenCalledWith('usr-ana', 'Lujo', expect.any(String));
  });

  it('sin sesión no se consulta la cuota: 401', async () => {
    const quota = quotaReturning({ allowed: true, counted: true, entitlements: free(0) });
    const res = await request(buildApp(quota).app).post('/api/v1/trips/plan').send(planInput);

    expect(res.status).toBe(401);
    expect(quota.consume).not.toHaveBeenCalled();
  });

  it('si no se puede comprobar el plan (auth-service caído) NO se genera: falla cerrado con 503', async () => {
    const gateway = new HttpAiPlanQuotaGateway('http://localhost:1', 'token', 300);
    const generatePlan = vi.fn().mockResolvedValue({ planId: 'p1' });
    const ai: AiServicePort = { generatePlan };
    const app = createApp({
      tripFacade: new TripFacade(ai, { executeConfirmTripSaga: vi.fn() }),
      aiPlanQuota: gateway,
    });

    const res = await request(app).post('/api/v1/trips/plan').set('Authorization', authHeader('usr-ana')).send(planInput);

    expect(res.status).toBe(503);
    expect(generatePlan).not.toHaveBeenCalled();
  });
});

describe('HttpAiPlanQuotaGateway', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('manda el token interno y devuelve la decisión de auth-service', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { allowed: true, counted: true, entitlements: free(1) } }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const decision = await new HttpAiPlanQuotaGateway('http://auth:3004', 'tok', 1000).consume('usr-1', 'Estándar', 'c-1');

    expect(decision.allowed).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://auth:3004/api/v1/internal/users/usr-1/ai-plans/consume');
    expect(init.headers['x-internal-token']).toBe('tok');
    expect(JSON.parse(init.body)).toEqual({ budgetCategory: 'Estándar' });
  });

  it('una respuesta 500 de auth-service también falla cerrado (503)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 500 })));

    await expect(new HttpAiPlanQuotaGateway('http://auth:3004', 'tok').consume('usr-1', undefined, 'c')).rejects.toMatchObject({
      statusCode: 503,
    });
  });

  it('cuenta inexistente (404) → 401 para que el cliente vuelva a iniciar sesión', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 404 })));

    await expect(new HttpAiPlanQuotaGateway('http://auth:3004', 'tok').consume('usr-1', undefined, 'c')).rejects.toMatchObject({
      statusCode: 401,
    });
  });
});
