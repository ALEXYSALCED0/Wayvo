import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/infrastructure/http/app';
import { CORRELATION_ID_HEADER } from '@wayvo/contracts';

describe('API Gateway Integration Tests', () => {
  const app = createApp();

  describe('Health Endpoints', () => {
    it('GET /health should return 200 and healthy status envelope', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.service).toBe('api-gateway');
      expect(res.body.data.status).toBe('healthy');
      expect(res.headers[CORRELATION_ID_HEADER]).toBeDefined();
    });

    it('GET /health/services should query downstream microservices and return report', async () => {
      const res = await request(app).get('/health/services');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.services).toBeInstanceOf(Array);
      expect(res.body.data.services.length).toBe(4);
    });
  });

  describe('Correlation ID Middleware', () => {
    it('should generate a new correlation ID if none is provided', async () => {
      const res = await request(app).get('/health');
      expect(res.headers[CORRELATION_ID_HEADER]).toBeDefined();
      expect(res.headers[CORRELATION_ID_HEADER].length).toBeGreaterThan(10);
    });

    it('should preserve and echo the incoming correlation ID', async () => {
      const customId = 'custom-trace-uuid-12345';
      const res = await request(app)
        .get('/health')
        .set(CORRELATION_ID_HEADER, customId);
      expect(res.headers[CORRELATION_ID_HEADER]).toBe(customId);
    });
  });

  describe('Requirement 8.18 - Centralized Error Middleware', () => {
    it('should return homogeneous 404 error when route is not found', async () => {
      const res = await request(app).get('/api/v1/non-existent-endpoint');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
      expect(res.body.error.message).toContain('No route matches');
      expect(res.headers[CORRELATION_ID_HEADER]).toBeDefined();
    });

    it('should return homogeneous 503 error when downstream microservice is offline', async () => {
      // Trying to proxy to offline service without fallback
      const res = await request(app).get('/api/v1/bookings/some-offline-id');
      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('DOWNSTREAM_SERVICE_UNAVAILABLE');
      expect(res.body.error.details).toBeDefined();
      expect(res.headers[CORRELATION_ID_HEADER]).toBeDefined();
    });

    it('should return homogeneous 400 error when payload contains invalid JSON', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Content-Type', 'application/json')
        .send('{ malformed json ');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_JSON_BODY');
    });
  });
});
