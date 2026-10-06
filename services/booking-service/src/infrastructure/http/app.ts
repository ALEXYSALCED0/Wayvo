import express, { Express } from 'express';
import { LoggerPort } from '../../application/ports/logger.port';
import { HealthController } from '../../adapters/http/controllers/health.controller';
import { healthRoutes } from '../../adapters/http/routes/health.routes';
import { errorMiddleware } from '../../adapters/http/middlewares/error.middleware';

export interface AppDependencies {
  logger: LoggerPort;
}

export function createApp({ logger }: AppDependencies): Express {
  const app = express();
  app.use(express.json());

  app.use(healthRoutes(new HealthController()));

  app.use(errorMiddleware(logger));
  return app;
}