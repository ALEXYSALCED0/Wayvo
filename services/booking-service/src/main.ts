// Punto de entrada: carga la configuración, arma el contenedor (composition root)
// y levanta el servidor HTTP.
import { loadConfig } from './infrastructure/config/env';
import { buildContainer } from './infrastructure/container';
import { createApp } from './infrastructure/http/app';
import { ConsoleLogger } from './infrastructure/logger/console.logger';

const config = loadConfig();
const logger = new ConsoleLogger('booking-service');
const container = buildContainer(config, logger);
const app = createApp(container);

const server = app.listen(config.port, () => {
  logger.info('booking-service listening', {
    port: config.port,
    env: config.nodeEnv,
    servicesMode: config.servicesMode,
    persistence: config.databaseUrl ? 'postgres' : 'in-memory',
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