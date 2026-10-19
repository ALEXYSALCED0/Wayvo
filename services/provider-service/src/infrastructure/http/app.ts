import cors from 'cors';
import express, { Express, NextFunction, Request, Response } from 'express';
import { fail, ok } from '../../adapters/http/presenters';
import { CORRELATION_ID_HEADER, createProvidersRouter } from '../../adapters/http/providers.router';
import { Container } from '../container';
import { mountMockApi } from '../mock/mount-mock';
import { MockSimulationState } from '../mock/simulation-state';

export const PROVIDERS_BASE_PATH = '/api/v1/providers';

export interface AppOptions {
  env?: Record<string, string | undefined>;
}

export interface CreatedApp {
  app: Express;
  // Presente solo si el simulador está montado (no en producción)
  mockState?: MockSimulationState;
}

export function createApp(container: Container, { env = process.env }: AppOptions = {}): CreatedApp {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Correlation ID, para respetar el que manda la Saga o se genera uno
  app.use((req: Request, res: Response, next: NextFunction) => {
    const incoming = req.headers[CORRELATION_ID_HEADER];
    const correlationId = typeof incoming === 'string' && incoming ? incoming : `prov-${Date.now()}`;
    res.setHeader(CORRELATION_ID_HEADER, correlationId);
    next();
  });

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json(ok({ status: 'healthy', service: 'provider-service', persistence: container.persistence.kind }));
  });

  app.use(
    PROVIDERS_BASE_PATH,
    createProvidersRouter({
      listProviders: container.listProviders,
      checkAvailability: container.checkAvailability,
      confirmReservation: container.confirmReservation,
      logger: container.logger,
    }),
  );

  // Simulador de APIs externas y endpoint de fallo controlado (no producción)
  const mockState = mountMockApi(app, env, container.logger);

  app.use((req: Request, res: Response) => {
    res.status(404).json(fail('NOT_FOUND', `Route ${req.method} ${req.path} not found`));
  });

  // JSON mal formado u otros errores de middleware (Express 4 exige los 4 parámetros)
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const type = (error as { type?: string } | null)?.type;
    if (type === 'entity.parse.failed') {
      res.status(400).json(fail('INVALID_JSON', 'Request body is not valid JSON'));
      return;
    }
    container.logger.error('Unhandled middleware error', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json(fail('INTERNAL_ERROR', 'Internal server error'));
  });

  return { app, mockState };
}
