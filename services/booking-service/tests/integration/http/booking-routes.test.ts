import request from 'supertest';
import { createBookingInput } from '../../unit/application/helpers';
import { buildTestApp } from './test-app';

describe('Endpoints de reservas', () => {
  it('POST /api/v1/bookings crea la reserva (201) en PENDING', async () => {
    const res = await request(buildTestApp().app).post('/api/v1/bookings').send(createBookingInput());

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PENDING');
    expect(res.body.data.totalAmount).toBe(500000);
  });

  it('responde 400 VALIDATION_ERROR si el body no tiene la forma correcta', async () => {
    const res = await request(buildTestApp().app).post('/api/v1/bookings').send({ tripId: 't' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });

  it('responde 422 si se viola una regla del dominio (reserva sin items)', async () => {
    const res = await request(buildTestApp().app)
      .post('/api/v1/bookings')
      .send(createBookingInput({ items: [] }));

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('INVALID_BOOKING');
  });

  it('POST /api/v1/bookings/:id/cancel cancela y es idempotente', async () => {
    const { app } = buildTestApp();
    const created = await request(app).post('/api/v1/bookings').send(createBookingInput());
    const id = created.body.data.id;

    const first = await request(app).post(`/api/v1/bookings/${id}/cancel`).send({ reason: 'Changed plans' });
    const second = await request(app).post(`/api/v1/bookings/${id}/cancel`).send({ reason: 'again' });

    expect(first.status).toBe(200);
    expect(first.body.data.status).toBe('CANCELLED');
    expect(second.status).toBe(200);
    expect(second.body.data.cancellationReason).toBe('Changed plans');
  });

  it('GET /api/v1/bookings/:id devuelve 404 si no existe', async () => {
    const res = await request(buildTestApp().app).get('/api/v1/bookings/nope');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('BOOKING_NOT_FOUND');
  });

  it('devuelve el X-Correlation-Id recibido o genera uno', async () => {
    const { app } = buildTestApp();
    const withHeader = await request(app).get('/health').set('X-Correlation-Id', 'abc-123');
    const without = await request(app).get('/health');

    expect(withHeader.headers['x-correlation-id']).toBe('abc-123');
    expect(without.headers['x-correlation-id']).toBeTruthy();
  });

  it('responde 404 en formato común para rutas que no existen', async () => {
    const res = await request(buildTestApp().app).get('/nada');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});