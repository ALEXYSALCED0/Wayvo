import express, { Express, Request, Response } from 'express';
import { correlationIdMiddleware } from '../../adapters/http/middlewares/correlation-id.middleware';
import { errorMiddleware } from '../../adapters/http/middlewares/error.middleware';
import { requestLoggerMiddleware } from '../../adapters/http/middlewares/request-logger.middleware';
import { mockRoutes } from '../../adapters/http/routes/mock.routes';
import { paymentRoutes } from '../../adapters/http/routes/payment.routes';
import { Container } from '../container';

export const PAYMENTS_BASE_PATH = '/api/v1/payments';
export const MOCK_BASE_PATH = '/api/v1/mock';

export interface AppOptions {
  nodeEnv?: string;
}

export function createApp(container: Container, { nodeEnv = process.env.NODE_ENV ?? 'development' }: AppOptions = {}): Express {
  const app = express();
  // El parser JSON NO es global: el webhook necesita el cuerpo crudo (ver payment.routes).
  app.use(correlationIdMiddleware(container.ids));
  app.use(requestLoggerMiddleware(container.logger));

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      data: { status: 'healthy', service: 'payment-service', mode: container.mode, persistence: container.persistence },
    });
  });

  app.use(PAYMENTS_BASE_PATH, paymentRoutes(container));

  // El simulador solo existe en modo mock y nunca en producción.
  if (container.simulation && nodeEnv !== 'production') {
    app.use(MOCK_BASE_PATH, mockRoutes(container.simulation));
  }

  app.use((_req, res) => {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found', details: null } });
  });
  app.use(errorMiddleware(container.logger));
  return app;
}
