import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AddressInfo } from 'node:net';
import { app } from '../../src/main';

// Flujo completo del Mediator por HTTP:
// crear viaje -> reportar incidencia (paso 1) -> elegir alternativa (paso 2).
describe('POST /api/v1/trips/:id/alternatives', () => {
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

  const post = async (path: string, body: unknown) => {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() };
  };

  // Viaje con un tren y un museo, y el tren ya reportado como perdido.
  async function tripWithMissedTrain() {
    const created = await post('/api/v1/trips', {
      userId: 'user-1',
      destination: 'Roma',
      startDate: '2026-12-01',
      endDate: '2026-12-03',
      events: [
        {
          type: 'TRANSPORT', title: 'Tren a Roma', description: 'Tren de la mañana',
          startDateTime: '2026-12-01T08:00:00Z', endDateTime: '2026-12-01T10:00:00Z',
          time: '08:00 - 10:00', order: 1,
        },
        {
          type: 'MUSEUM', title: 'Museos Vaticanos', description: 'Visita guiada',
          startDateTime: '2026-12-01T16:00:00Z', time: '16:00', order: 2,
        },
      ],
    });
    const tripId = created.body.data.id;
    const train = created.body.data.events.find((e: { title: string }) => e.title === 'Tren a Roma');

    const incident = await post(`/api/v1/trips/${tripId}/incidents`, {
      eventId: train.id, type: 'MISSED', reason: 'Perdí el tren',
    });

    return { tripId, trainId: train.id, alternatives: incident.body.data.alternatives };
  }

  it('elige la alternativa: cancela el evento afectado y agrega los nuevos', async () => {
    const { tripId, trainId, alternatives } = await tripWithMissedTrain();
    const recommended = alternatives.find((a: { isRecommended?: boolean }) => a.isRecommended);

    const { status, body } = await post(`/api/v1/trips/${tripId}/alternatives`, {
      eventId: trainId, alternativeId: recommended.id,
    });

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.selectedAlternative.id).toBe(recommended.id);

    const events = body.data.updatedTrip.events;
    expect(events.find((e: { id: string }) => e.id === trainId).status).toBe('CANCELLED');
    expect(events.some((e: { isAlternative?: boolean }) => e.isAlternative)).toBe(true);
    expect(events.find((e: { title: string }) => e.title === 'Museos Vaticanos').status).toBe('PENDING');
  });

  it('responde 404 si la alternativa no existe', async () => {
    const { tripId, trainId } = await tripWithMissedTrain();

    const { status, body } = await post(`/api/v1/trips/${tripId}/alternatives`, {
      eventId: trainId, alternativeId: 'no-existe',
    });

    expect(status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('responde 400 si faltan datos', async () => {
    const { tripId } = await tripWithMissedTrain();

    const { status, body } = await post(`/api/v1/trips/${tripId}/alternatives`, {});

    expect(status).toBe(400);
    expect(body.error.code).toBe('INVALID_DATA');
  });

  it('reportar una incidencia sin eventId responde 400 (antes daba 404)', async () => {
    const { tripId } = await tripWithMissedTrain();

    const { status } = await post(`/api/v1/trips/${tripId}/incidents`, {
      type: 'MISSED', reason: 'Sin evento',
    });

    expect(status).toBe(400);
  });
});
