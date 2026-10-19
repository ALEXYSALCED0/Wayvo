
import express from 'express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AddressInfo } from 'node:net';
import { EventController } from '../../src/adapters/controllers/EventController';
import { buildContainer } from '../../src/infrastructure/container';
import { makeTripWithEvents } from '../unit/domain/helpers';

describe('POST /api/v1/trips/:id/incidents', () => {
  const container = buildContainer();
  const fixture = makeTripWithEvents();

  const testApp = express();
  let server: ReturnType<typeof testApp.listen>;
  let baseUrl: string;

  beforeAll(async () => {
    await container.tripRepository.save(fixture.trip);

    testApp.use(express.json());
    const controller = new EventController(container.mediator);

    testApp.post(
      '/api/v1/trips/:id/incidents',
      controller.reportIncident,
    );

    server = testApp.listen(0);
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(() => {
    server?.close();
  });

  it('reporta una incidencia y devuelve alternativas', async () => {
    const response = await fetch(
      `${baseUrl}/api/v1/trips/${fixture.trip.id}/incidents`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: fixture.train.id,
          type: 'MISSED',
          reason: 'Perdí el tren',
        }),
      },
    );

    const body = await response.json() as {
      success: boolean;
      data?: {
        affectedEvent: { id: string; status: string };
        alternatives: unknown[];
        updatedTrip: { id: string };
      };
      error?: { message: string };
    };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data?.affectedEvent.id).toBe(fixture.train.id);
    expect(body.data?.affectedEvent.status).toBe('ISSUE');
    expect(body.data?.alternatives.length).toBeGreaterThan(0);
    expect(body.data?.updatedTrip.id).toBe(fixture.trip.id);

    const incidents = await container.incidentRepository.findByTripId(
      fixture.trip.id,
    );

    expect(incidents).toHaveLength(1);
    expect(incidents[0].resolved).toBe(false);
  });
});
