import dotenv from 'dotenv';
import { buildContainer } from './infrastructure/container';
import { createApp, PROVIDERS_BASE_PATH } from './infrastructure/http/app';
import { MOCK_BASE_PATH } from './infrastructure/mock/mount-mock';

dotenv.config();

// Punto de entrada para armar el contenedor, crear la app Express y levantarla
async function main(): Promise<void> {
  const port = Number(process.env.PORT || 3002);
  const container = await buildContainer(process.env);
  const { app, mockState } = createApp(container, { env: process.env });

  const server = app.listen(port, () => {
    container.logger.info('provider-service listening', {
      port,
      env: process.env.NODE_ENV ?? 'development',
      persistence: container.persistence.kind,
      externalProviders: process.env.EXTERNAL_PROVIDERS_MODE ?? 'real',
      providersApi: PROVIDERS_BASE_PATH,
      ...(mockState && { mockApi: MOCK_BASE_PATH, mockMode: mockState.status().activeMode }),
    });
  });

  const shutdown = async (signal: string): Promise<void> => {
    container.logger.info('Shutting down', { signal });
    server.close();
    await container.shutdown();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

if (process.env.NODE_ENV !== 'test') {
  main().catch((error) => {
    console.error('[provider-service] failed to start:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
