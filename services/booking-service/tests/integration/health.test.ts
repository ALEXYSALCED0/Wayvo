import request from 'supertest';
import { createApp } from '../../src/infrastructure/http/app';
import { LoggerPort } from '../../src/application/ports/logger.port';

const silentLogger: LoggerPort = { info: () => {}, warn: () => {}, error: () => {} };

describe('GET /health', () => {
  it('responde 200 con el estado del servicio', async () => {
    const res = await request(createApp({ logger: silentLogger })).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', service: 'booking-service' });
  });
});