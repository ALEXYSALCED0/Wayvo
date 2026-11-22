// Punto de entrada: carga la configuración, arma el contenedor (composition root)
// y levanta el servidor HTTP.
import { DEV_JWT_SECRET, loadConfig } from './infrastructure/config/env';
import { buildContainer } from './infrastructure/container';
import { createApp } from './infrastructure/http/app';
import { ConsoleLogger } from './infrastructure/logger/console.logger';

const config = loadConfig();
const logger = new ConsoleLogger('auth-service');
const container = buildContainer(config, logger);
const app = createApp(container);

if (config.jwtSecret === DEV_JWT_SECRET) {
  logger.warn('Usando JWT_SECRET de desarrollo. Define JWT_SECRET en .env');
}

const server = app.listen(config.port, () => {
  logger.info('auth-service listening', {
    port: config.port,
    env: config.nodeEnv,
    persistence: container.persistence,
  });
});

async function shutdown(signal: string): Promise<void> {
  logger.info('Shutting down', { signal });
  server.close();
  await container.shutdown();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
