import request from 'supertest';
import { buildTestApp } from './http/test-app';

describe('GET /health', () => {
  it('responde 200 con el estado del servicio', async () => {
    const res = await request(buildTestApp().app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', service: 'booking-service' });
  });
});