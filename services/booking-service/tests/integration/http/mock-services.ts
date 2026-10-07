import express from 'express';
import { AddressInfo } from 'node:net';
import { Server } from 'node:http';

// Servidores HTTP reales que imitan trip-service y provider-service, para probar
// los adapters HTTP y el flujo completo sin depender de los compañeros.

export interface MockServices {
  tripUrl: string;
  providerUrl: string;
  tripStatus: Map<string, string>;
  receivedCorrelationIds: string[];
  setProviderMode(mode: 'ok' | 'unavailable' | 'error' | 'slow'): void;
  close(): Promise<void>;
}

function listen(app: express.Express): Promise<{ server: Server; url: string }> {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const { port } = server.address() as AddressInfo;
      resolve({ server, url: `http://127.0.0.1:${port}` });
    });
  });
}

export async function startMockServices(): Promise<MockServices> {
  const tripStatus = new Map<string, string>();
  const receivedCorrelationIds: string[] = [];
  let providerMode: 'ok' | 'unavailable' | 'error' | 'slow' = 'ok';
  let nextTrip = 0;

  const trip = express();
  trip.use(express.json());
  trip.use((req, _res, next) => {
    receivedCorrelationIds.push(req.header('x-correlation-id') ?? '');
    next();
  });
  trip.post('/api/v1/trips', (_req, res) => {
    nextTrip += 1;
    const id = `trip-${nextTrip}`;
    tripStatus.set(id, 'PENDING');
    res.status(201).json({ success: true, data: { id, status: 'PENDING' } });
  });
  trip.post('/api/v1/trips/:id/confirm', (req, res) => {
    tripStatus.set(req.params.id, 'CONFIRMED');
    res.json({ success: true, data: { id: req.params.id, status: 'CONFIRMED' } });
  });
  trip.post('/api/v1/trips/:id/cancel', (req, res) => {
    tripStatus.set(req.params.id, 'CANCELLED');
    res.json({ success: true, data: { id: req.params.id, status: 'CANCELLED' } });
  });

  const provider = express();
  provider.use(express.json());
  provider.post('/api/v1/providers/check-availability', async (_req, res) => {
    if (providerMode === 'error') {
      res.status(503).json({ success: false, error: { code: 'UNAVAILABLE', message: 'Service down' } });
      return;
    }
    if (providerMode === 'slow') await new Promise((r) => setTimeout(r, 300));
    if (providerMode === 'unavailable') {
      res.json({ success: true, data: { available: false, reason: 'No rooms left' } });
      return;
    }
    res.json({ success: true, data: { available: true } });
  });
  provider.post('/api/v1/providers/confirm', (_req, res) => {
    res.json({ success: true, data: { reservationCode: 'RSV-HTTP-1' } });
  });

  const t = await listen(trip);
  const p = await listen(provider);

  return {
    tripUrl: t.url,
    providerUrl: p.url,
    tripStatus,
    receivedCorrelationIds,
    setProviderMode: (mode) => {
      providerMode = mode;
    },
    close: async () => {
      t.server.closeAllConnections();
      p.server.closeAllConnections();
      await Promise.all([
        new Promise((r) => t.server.close(r)),
        new Promise((r) => p.server.close(r)),
      ]);
    },
  };
}