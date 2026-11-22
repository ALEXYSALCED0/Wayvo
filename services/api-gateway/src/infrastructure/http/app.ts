import express, { Express, Request, Response, NextFunction } from 'express';
import { HttpAiServiceGateway } from '../../adapters/gateways/http-ai-service.gateway';
import { HttpBookingServiceGateway } from '../../adapters/gateways/http-booking-service.gateway';
import { TripFacadeController } from '../../adapters/http/controllers/trip-facade.controller';
import { createAuthMiddleware } from '../../adapters/http/middlewares/auth.middleware';
import { correlationIdMiddleware } from '../../adapters/http/middlewares/correlation-id.middleware';
import { corsMiddleware } from '../../adapters/http/middlewares/cors.middleware';
import { errorMiddleware } from '../../adapters/http/middlewares/error.middleware';
import { requestLoggerMiddleware } from '../../adapters/http/middlewares/request-logger.middleware';
import { healthRouter } from '../../adapters/http/routes/health.routes';
import { proxyRouter } from '../../adapters/http/routes/proxy.routes';
import { createTripFacadeRouter } from '../../adapters/http/routes/trip-facade.routes';
import { TripFacade } from '../../application/facades/trip.facade';
import { TokenVerifier } from '../../application/ports/token-verifier.port';
import { RouteNotFoundError } from '../../domain/errors/gateway.error';
import { JwtTokenVerifier } from '../auth/jwt-token-verifier';
import { config } from '../config/env';

export interface AppDependencies {
  tripFacade?: TripFacade;
  tokenVerifier?: TokenVerifier;
}

export function createApp(deps: AppDependencies = {}): Express {
  const app = express();

  // Initialize TripFacade if not injected
  const aiGateway = new HttpAiServiceGateway(config.AI_SERVICE_URL, 45000);
  const bookingGateway = new HttpBookingServiceGateway(config.BOOKING_SERVICE_URL, config.HTTP_TIMEOUT_MS);
  const tripFacade = deps.tripFacade || new TripFacade(aiGateway, bookingGateway);
  const tripFacadeController = new TripFacadeController(tripFacade);
  const tripFacadeRouter = createTripFacadeRouter(tripFacadeController);
  const tokenVerifier = deps.tokenVerifier || new JwtTokenVerifier(config.JWT_SECRET);

  // 1. Essential security, CORS and tracing middlewares
  app.use(corsMiddleware);
  app.use(correlationIdMiddleware);
  app.use(requestLoggerMiddleware);

  // 2. Health routes (gateway liveness and readiness)
  app.use(healthRouter);

  // 3. Body parsers (needed for local endpoints and logging)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 4. Autenticación (multiusuario): valida el JWT y propaga la identidad
  //    (x-user-id / x-user-role) a todo lo que viene después.
  app.use(createAuthMiddleware(tokenVerifier));

  // 5. Facade routes (GoF Facade Pattern: POST /api/v1/trips/plan, POST /api/v1/trips/checkout)
  // Mounted before proxyRouter to intercept consolidated endpoints
  app.use(tripFacadeRouter);

  // 6. Reverse Proxy Routes to Downstream Microservices (auth, trips, bookings, saga, providers, ai)
  app.use(proxyRouter);

  // 7. 404 handler for unknown routes
  app.use((req: Request, res: Response, next: NextFunction) => {
    next(new RouteNotFoundError(req.originalUrl, req.method));
  });

  // 8. Centralized Error Middleware (Requirement 8.18)
  app.use(errorMiddleware);

  return app;
}
