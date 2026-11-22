import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { BudgetCategory, UserRole } from '@wayvo/contracts';
import { createApp } from '../src/infrastructure/http/app';
import { TripFacade } from '../src/application/facades/trip.facade';
import { AiServicePort } from '../src/application/ports/ai-service.port';
import { BookingServicePort } from '../src/application/ports/booking-service.port';
import { authHeader, signTestToken } from './auth-helpers';

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

function buildApp() {
  const ai: AiServicePort = { generatePlan: vi.fn().mockResolvedValue({ planId: 'p1' }) };
  const booking: BookingServicePort = { executeConfirmTripSaga: vi.fn() };
  return { app: createApp({ tripFacade: new TripFacade(ai, booking) }), ai };
}

describe('Autenticación en el API Gateway (multiusuario)', () => {
  it('sin token, una ruta protegida responde 401 con el formato común', async () => {
    const res = await request(buildApp().app).get('/api/v1/trips');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      success: false,
      error: expect.objectContaining({ code: 'UNAUTHENTICATED' }),
    });
  });

  it('un token firmado con otro secreto (falsificado) responde 401', async () => {
    const forged = signTestToken('usr-hacker', UserRole.ADMIN, 'secreto-falso');

    const res = await request(buildApp().app).get('/api/v1/trips').set('Authorization', `Bearer ${forged}`);

    expect(res.status).toBe(401);
  });

  it('registro y login son públicos: llegan al proxy de auth-service sin token', async () => {
    // El gateway no la bloquea: responde auth-service (o el proxy con 503 si no está corriendo).
    // Lo que nunca debe aparecer es el error de autenticación del propio gateway.
    const res = await request(buildApp().app)
      .post('/api/v1/auth/login')
      .send({ email: 'a@b.com', password: 'x' });

    expect(res.body.error?.code).not.toBe('UNAUTHENTICATED');
  });

  it('la Facade usa el usuario del token aunque el cliente envíe otro userId o un x-user-id falso', async () => {
    const { app, ai } = buildApp();

    await request(app)
      .post('/api/v1/trips/plan')
      .set('Authorization', authHeader('usr-real'))
      .set('x-user-id', 'usr-victima')
      .send({ ...planInput, userId: 'usr-victima' })
      .expect(200);

    expect(ai.generatePlan).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'usr-real' }),
      expect.any(String),
    );
  });

  it('las herramientas de simulación (/api/v1/mock) exigen rol ADMIN', async () => {
    const { app } = buildApp();

    const traveler = await request(app)
      .get('/api/v1/mock/simulate-failure?mode=unavailable')
      .set('Authorization', authHeader('usr-viajero', UserRole.TRAVELER));
    const admin = await request(app)
      .get('/api/v1/mock/simulate-failure?mode=unavailable')
      .set('Authorization', authHeader('usr-admin', UserRole.ADMIN));

    expect(traveler.status).toBe(403);
    expect(traveler.body.error.code).toBe('FORBIDDEN');
    expect(admin.body.error?.code).not.toBe('FORBIDDEN'); // pasa al proxy de provider-service
  });
});
