import { Router } from 'express';
import { createServiceProxy } from '../../../infrastructure/proxy/http-proxy';
import { aiMockFallback, providerMockFallback, tripMockFallback } from '../../../infrastructure/proxy/mock-fallbacks';
import { config } from '../../../infrastructure/config/env';

export const proxyRouter = Router();

// ==========================================
// 0. AUTH SERVICE (:3004) - Multiusuario (registro, login, /me)
// ==========================================
proxyRouter.use(
  '/api/v1/auth',
  createServiceProxy({
    serviceName: 'auth-service',
    target: config.AUTH_SERVICE_URL,
  }),
);

// ==========================================
// 0b. PAYMENT SERVICE (:3005) - Suscripción PREMIUM de la cuenta (Stripe detrás del Adapter)
//     El webhook de Stripe se monta aparte en app.ts (necesita el cuerpo crudo).
// ==========================================
proxyRouter.use(
  '/api/v1/payments',
  createServiceProxy({
    serviceName: 'payment-service',
    target: config.PAYMENT_SERVICE_URL,
  }),
);

// Simulador de pagos (solo ADMIN, solo con PAYMENTS_MODE=mock). Va antes del /mock de provider-service.
proxyRouter.use(
  '/api/v1/mock/simulate-payment',
  createServiceProxy({
    serviceName: 'payment-service',
    target: config.PAYMENT_SERVICE_URL,
  }),
);

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
    timeoutMs: 45000,
  }),
);
