import express, { Express, Request, Response, NextFunction } from 'express';
import { correlationIdMiddleware } from '../../adapters/http/middlewares/correlation-id.middleware';
import { corsMiddleware } from '../../adapters/http/middlewares/cors.middleware';
import { errorMiddleware } from '../../adapters/http/middlewares/error.middleware';
import { requestLoggerMiddleware } from '../../adapters/http/middlewares/request-logger.middleware';
import { healthRouter } from '../../adapters/http/routes/health.routes';
import { proxyRouter } from '../../adapters/http/routes/proxy.routes';
import { RouteNotFoundError } from '../../domain/errors/gateway.error';

export function createApp(): Express {
  const app = express();

  // 1. Essential security, CORS and tracing middlewares
  app.use(corsMiddleware);
  app.use(correlationIdMiddleware);
  app.use(requestLoggerMiddleware);

  // 2. Health routes (gateway liveness and readiness)
  app.use(healthRouter);

  // 3. Body parsers (needed for local endpoints and logging)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 4. Reverse Proxy Routes to Downstream Microservices
  app.use(proxyRouter);

  // 5. 404 handler for unknown routes
  app.use((req: Request, res: Response, next: NextFunction) => {
    next(new RouteNotFoundError(req.originalUrl, req.method));
  });

  // 6. Centralized Error Middleware (Requirement 8.18)
  app.use(errorMiddleware);

  return app;
}
