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
