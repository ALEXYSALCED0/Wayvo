import { Router, Request, Response } from 'express';
import { ApiResponse } from '@wayvo/contracts';
import { config } from '../../../infrastructure/config/env';

export const healthRouter = Router();

// Fast liveness probe
healthRouter.get('/health', (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    data: {
      status: 'healthy',
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime(),
    },
  };
  res.status(200).json(response);
});

// Downstream readiness probe for all 4 microservices from the architecture diagram
healthRouter.get('/health/services', async (req: Request, res: Response) => {
  const servicesToCheck = [
    { name: 'booking-service', url: `${config.BOOKING_SERVICE_URL}/health` },
    { name: 'trip-service', url: `${config.TRIP_SERVICE_URL}/health` },
    { name: 'provider-service', url: `${config.PROVIDER_SERVICE_URL}/health` },
    { name: 'ai-recommendation', url: `${config.AI_SERVICE_URL}/health` },
  ];

  const results = await Promise.all(
    servicesToCheck.map(async (svc) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(svc.url, { signal: controller.signal });
        clearTimeout(timeoutId);
        return {
          service: svc.name,
          url: svc.url,
          status: res.ok ? 'ONLINE' : 'DEGRADED',
          statusCode: res.status,
        };
      } catch (err: any) {
        return {
          service: svc.name,
          url: svc.url,
          status: 'OFFLINE_OR_IN_DEV',
          error: err.name === 'AbortError' ? 'TIMEOUT' : 'CONNECTION_REFUSED',
        };
      }
    }),
  );

  const allOnline = results.every((r) => r.status === 'ONLINE');

  const response: ApiResponse = {
    success: true,
    data: {
      gatewayStatus: 'ONLINE',
      allServicesOnline: allOnline,
      services: results,
    },
    message: allOnline
      ? 'All downstream microservices are online'
      : 'Some downstream microservices are currently offline or in development',
  };

  res.status(200).json(response);
});
