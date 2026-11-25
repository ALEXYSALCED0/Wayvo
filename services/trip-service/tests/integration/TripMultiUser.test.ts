import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AddressInfo } from 'node:net';
import { USER_ID_HEADER } from '@wayvo/contracts';
import { app } from '../../src/main';

// Multiusuario: el API Gateway propaga la identidad en el header x-user-id.
// Cada usuario solo puede ver y modificar sus propios viajes.
describe('Aislamiento de viajes entre usuarios', () => {
  let server: ReturnType<typeof app.listen>;
  let baseUrl: string;

  beforeAll(() => {
    server = app.listen(0);
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(() => {
    server?.close();
  });

  const call = (method: string, path: string, userId?: string, body?: unknown) =>
    fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(userId ? { [USER_ID_HEADER]: userId } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

  async function createTripAs(userId: string, destination: string): Promise<string> {
    // El cuerpo dice "otro-usuario", pero manda el header que puso el gateway.
    const res = await call('POST', '/api/v1/trips', userId, {
      userId: 'otro-usuario',
      destination,
      startDate: '2026-12-10',
      endDate: '2026-12-12',
    });
    const body = await res.json();
    expect(body.data.userId).toBe(userId);
    return body.data.id;
  }

  it('"Mis viajes" lista solo los viajes del usuario autenticado', async () => {
    await createTripAs('ana', 'Cartagena');
    await createTripAs('luis', 'Medellín');

    const res = await call('GET', '/api/v1/trips', 'ana');
    const body = await res.json();

    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.every((t: { userId: string }) => t.userId === 'ana')).toBe(true);
  });

  it('un usuario no puede ver, modificar ni borrar el viaje de otro (404)', async () => {
    const tripId = await createTripAs('ana', 'Santa Marta');

    const get = await call('GET', `/api/v1/trips/${tripId}`, 'luis');
    const cancel = await call('POST', `/api/v1/trips/${tripId}/cancel`, 'luis');
    const del = await call('DELETE', `/api/v1/trips/${tripId}`, 'luis');

    expect([get.status, cancel.status, del.status]).toEqual([404, 404, 404]);

    // El viaje de Ana sigue intacto.
    const own = await call('GET', `/api/v1/trips/${tripId}`, 'ana');
    expect(own.status).toBe(200);
    expect((await own.json()).data.status).toBe('PENDING');
  });

  it('las llamadas internas sin x-user-id (Saga) siguen funcionando', async () => {
    const tripId = await createTripAs('ana', 'Bogotá');

    const confirm = await call('POST', `/api/v1/trips/${tripId}/confirm`);

    expect(confirm.status).toBe(200);
  });

  it('listar sin usuario (ni header ni query) responde 400', async () => {
    const res = await call('GET', '/api/v1/trips');
    expect(res.status).toBe(400);
  });
});
