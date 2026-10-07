import express, { Express } from 'express';
import { correlationIdMiddleware } from '../../adapters/http/middlewares/correlation-id.middleware';
import { errorMiddleware } from '../../adapters/http/middlewares/error.middleware';
import { requestLoggerMiddleware } from '../../adapters/http/middlewares/request-logger.middleware';
import { bookingRoutes } from '../../adapters/http/routes/booking.routes';
import { healthRoutes } from '../../adapters/http/routes/health.routes';
import { sagaRoutes } from '../../adapters/http/routes/saga.routes';
import { Container } from '../container';

export function createApp(container: Container): Express {
  const app = express();
  app.use(express.json());
  app.use(correlationIdMiddleware(container.ids));
  app.use(requestLoggerMiddleware(container.logger));

  app.use(healthRoutes(container.healthController));
  app.use(bookingRoutes(container.bookingController));
  app.use(sagaRoutes(container.sagaController));

  app.use((_req, res) => {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found', details: null } });
  });
  app.use(errorMiddleware(container.logger));
  return app;
}