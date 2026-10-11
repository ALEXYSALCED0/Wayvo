import { Router } from 'express';
import { createServiceProxy } from '../../../infrastructure/proxy/http-proxy';
import { aiMockFallback, providerMockFallback, tripMockFallback } from '../../../infrastructure/proxy/mock-fallbacks';
import { config } from '../../../infrastructure/config/env';

export const proxyRouter = Router();

// ==========================================
// 1. BOOKING SERVICE (:3001) - Dev 1 (Saga Orchestrator)
// ==========================================
proxyRouter.use(
  '/api/v1/bookings',
  createServiceProxy({
    serviceName: 'booking-service',
    target: config.BOOKING_SERVICE_URL,
  }),
);

proxyRouter.use(
  '/api/v1/saga',
  createServiceProxy({
    serviceName: 'booking-service',
    target: config.BOOKING_SERVICE_URL,
  }),
);

// ==========================================
// 2. TRIP SERVICE (:3003) - Dev 4 (Mediator)
// ==========================================
proxyRouter.use(
  '/api/v1/trips',
  createServiceProxy({
    serviceName: 'trip-service',
    target: config.TRIP_SERVICE_URL,
    mockFallbackHandler: tripMockFallback,
  }),
);

// ==========================================
// 3. PROVIDER SERVICE (:3002) - Dev 3 (Adapter)
// ==========================================
proxyRouter.use(
  '/api/v1/providers',
  createServiceProxy({
    serviceName: 'provider-service',
    target: config.PROVIDER_SERVICE_URL,
    mockFallbackHandler: providerMockFallback,
  }),
);

proxyRouter.use(
  '/api/v1/mock',
  createServiceProxy({
    serviceName: 'provider-service',
    target: config.PROVIDER_SERVICE_URL,
    mockFallbackHandler: providerMockFallback,
  }),
);

// ==========================================
// 4. AI RECOMMENDATION SERVICE (:8000) - Dev 4 (LangGraph Python)
// ==========================================
proxyRouter.use(
  '/api/v1/ai',
  createServiceProxy({
    serviceName: 'ai-recommendation',
    target: config.AI_SERVICE_URL,
    mockFallbackHandler: aiMockFallback,
  }),
);
