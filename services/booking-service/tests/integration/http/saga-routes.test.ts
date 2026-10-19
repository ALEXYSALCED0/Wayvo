import request from 'supertest';
import { createBookingInput } from '../../unit/application/helpers';
import { buildTestApp } from './test-app';

function confirmTripBody() {
  const { userId, currency, items } = createBookingInput();
  return {
    userId,
    currency,
    items,
    trip: { destination: 'Cartagena', startDate: '2026-12-01', endDate: '2026-12-03' },
  };
}

describe('POST /api/v1/saga/confirm-trip', () => {
  it('flujo feliz: 201 con viaje y reserva confirmados', async () => {
    const { app, trips } = buildTestApp();

    const res = await request(app)
      .post('/api/v1/saga/confirm-trip')
      .set('X-Correlation-Id', 'corr-ok')
      .send(confirmTripBody());

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('CONFIRMED');
    expect(res.body.data.correlationId).toBe('corr-ok');
    expect(trips.status.get('trip-1')).toBe('CONFIRMED');

    const booking = await request(app).get(`/api/v1/bookings/${res.body.data.bookingId}`);
    expect(booking.body.data.status).toBe('CONFIRMED');
  });

  it('proveedor sin cupo: 409 SAGA_COMPENSATED y la traza se puede consultar', async () => {
    const { app, providers, trips } = buildTestApp();
    providers.mode = 'unavailable';

    const res = await request(app)
      .post('/api/v1/saga/confirm-trip')
      .set('X-Correlation-Id', 'corr-fail')
      .send(confirmTripBody());

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('SAGA_COMPENSATED');
    expect(res.body.error.details.failedStep).toBe('RESERVE_PROVIDER');
    expect(trips.status.get('trip-1')).toBe('CANCELLED');

    const booking = await request(app).get(`/api/v1/bookings/${res.body.error.details.bookingId}`);
    expect(booking.body.data.status).toBe('CANCELLED');

    const log = await request(app).get('/api/v1/saga/corr-fail/compensation-log');
    expect(log.status).toBe(200);
    expect(log.body.data.entries.map((e: { step: string }) => e.step)).toEqual([
      'COMPENSATE_BOOKING',
      'COMPENSATE_TRIP',
    ]);
  });

  it('si una compensación falla responde 500 SAGA_COMPENSATION_FAILED', async () => {
    const { app, providers, trips } = buildTestApp();
    providers.mode = 'unavailable';
    trips.failOn = 'cancel';

    const res = await request(app).post('/api/v1/saga/confirm-trip').send(confirmTripBody());

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('SAGA_COMPENSATION_FAILED');
  });

  it('valida el body (400)', async () => {
    const res = await request(buildTestApp().app).post('/api/v1/saga/confirm-trip').send({ userId: 'u' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});