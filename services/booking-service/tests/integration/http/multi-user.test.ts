import request from 'supertest';
import { createBookingInput } from '../../unit/application/helpers';
import { buildTestApp } from './test-app';

// Multiusuario: el API Gateway propaga el usuario autenticado en el header x-user-id.
describe('Reservas por usuario (x-user-id)', () => {
  it('la reserva queda a nombre del usuario del header, no del body', async () => {
    const res = await request(buildTestApp().app)
      .post('/api/v1/bookings')
      .set('x-user-id', 'ana')
      .send(createBookingInput({ userId: 'otro-usuario' }));

    expect(res.status).toBe(201);
    expect(res.body.data.userId).toBe('ana');
  });

  it('un usuario no puede ver ni cancelar la reserva de otro (404)', async () => {
    const { app } = buildTestApp();
    const created = await request(app).post('/api/v1/bookings').set('x-user-id', 'ana').send(createBookingInput());
    const id = created.body.data.id;

    const get = await request(app).get(`/api/v1/bookings/${id}`).set('x-user-id', 'luis');
    const cancel = await request(app)
      .post(`/api/v1/bookings/${id}/cancel`)
      .set('x-user-id', 'luis')
      .send({ reason: 'intento ajeno' });
    const own = await request(app).get(`/api/v1/bookings/${id}`).set('x-user-id', 'ana');

    expect(get.status).toBe(404);
    expect(cancel.status).toBe(404);
    expect(own.status).toBe(200);
    expect(own.body.data.status).toBe('PENDING'); // no se canceló
  });

  it('la Saga crea viaje y reserva a nombre del usuario autenticado', async () => {
    const { app } = buildTestApp();
    const { currency, items } = createBookingInput();

    const res = await request(app)
      .post('/api/v1/saga/confirm-trip')
      .set('x-user-id', 'ana')
      .send({
        userId: 'otro-usuario',
        currency,
        items,
        trip: { destination: 'Cartagena', startDate: '2026-12-01', endDate: '2026-12-03' },
      });

    expect(res.status).toBe(201);
    const booking = await request(app).get(`/api/v1/bookings/${res.body.data.bookingId}`).set('x-user-id', 'ana');
    expect(booking.body.data.userId).toBe('ana');
  });
});
