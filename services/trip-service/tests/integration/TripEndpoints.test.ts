import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AddressInfo } from 'node:net';
import { app } from '../../src/main';

// Prueba las rutas reales de main.ts, las mismas que llama la Saga de booking-service.
describe('Endpoints de viajes', () => {
  let server: ReturnType<typeof app.listen>;
  let baseUrl: string;

  beforeAll(() => {
    server = app.listen(0);
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(() => {
    server?.close();
  });

  const post = (path: string, body: unknown = {}) =>
    fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  async function createTrip(): Promise<string> {
    const response = await post('/api/v1/trips', {
      userId: 'user-1',
      destination: 'Cartagena',
      startDate: '2026-11-15',
      endDate: '2026-11-18',
      status: 'PENDING',
    });
    const body = await response.json();
    return body.data.id;
  }

  it('POST /trips crea el viaje en PENDING y responde con el DTO del contrato', async () => {
    const response = await post('/api/v1/trips', {
      userId: 'user-1',
      destination: 'Cartagena',
      startDate: '2026-11-15',
      endDate: '2026-11-18',
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBeTruthy();
    expect(body.data.status).toBe('PENDING');
    // No se filtran los campos privados de la entidad.
    expect(body.data._status).toBeUndefined();
  });

  it('POST /trips guarda los eventos del itinerario que genera la IA', async () => {
    const aiEvent = (id: string, title: string, start: string, end: string, price: number) => ({
      id,
      tripId: 'plan-de-la-ia',
      type: 'ACTIVITY',
      title,
      description: 'Sugerido por la IA',
      location: 'Cartagena',
      startDateTime: start,
      endDateTime: end,
      time: `${start.slice(11, 16)} - ${end.slice(11, 16)}`,
      status: 'PENDING',
      reservationStatus: 'NOT_RESERVED',
      order: 1,
      details: { price },
    });

    const response = await post('/api/v1/trips', {
      userId: 'user-1',
      destination: 'Cartagena',
      startDate: '2026-11-15',
      endDate: '2026-11-18',
      events: [
        // Llega desordenado: el viaje lo ordena por hora.
        aiEvent('e2', 'Cena de despedida', '2026-11-18T21:00:00', '2026-11-18T22:00:00', 80000),
        aiEvent('e1', 'Ciudad amurallada', '2026-11-15T09:00:00', '2026-11-15T11:00:00', 50000),
      ],
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data.events).toHaveLength(2);

    const [first, last] = body.data.events;
    expect(first.title).toBe('Ciudad amurallada');
    expect(first.order).toBe(1);
    expect(first.tripId).toBe(body.data.id); // el id lo asigna trip-service
    expect(first.details.price).toBe(50000);
    // 21:00 sin zona se interpreta como UTC: sigue dentro del último día.
    expect(last.startDateTime).toBe('2026-11-18T21:00:00.000Z');
    expect(last.time).toBe('21:00 - 22:00');
  });

  it('POST /trips sin los campos obligatorios responde 400', async () => {
    const response = await post('/api/v1/trips', { destination: 'Cartagena' });

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe('INVALID_DATA');
  });

  it('GET /trips/:id devuelve el viaje y 404 si no existe', async () => {
    const id = await createTrip();

    const found = await fetch(`${baseUrl}/api/v1/trips/${id}`);
    const missing = await fetch(`${baseUrl}/api/v1/trips/no-existe`);

    expect(found.status).toBe(200);
    expect((await found.json()).data.id).toBe(id);
    expect(missing.status).toBe(404);
    expect((await missing.json()).error.code).toBe('NOT_FOUND');
  });

  it('POST /trips/:id/confirm deja el viaje en CONFIRMED', async () => {
    const id = await createTrip();

    const response = await post(`/api/v1/trips/${id}/confirm`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.status).toBe('CONFIRMED');
  });

  it('POST /trips/:id/cancel deja el viaje en CANCELLED', async () => {
    const id = await createTrip();

    const response = await post(`/api/v1/trips/${id}/cancel`, { reason: 'Saga compensation' });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.status).toBe('CANCELLED');
  });

  it('confirmar un viaje cancelado responde 409', async () => {
    const id = await createTrip();
    await post(`/api/v1/trips/${id}/cancel`, { reason: 'Proveedor no disponible' });

    const response = await post(`/api/v1/trips/${id}/confirm`);

    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe('INVALID_TRIP_STATE');
  });

  it('cancelar con un motivo vacío responde 400', async () => {
    const id = await createTrip();

    const response = await post(`/api/v1/trips/${id}/cancel`, { reason: '' });

    expect(response.status).toBe(400);
  });
});
