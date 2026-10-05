// Composition root: único lugar donde se instancian las dependencias
// concretas y se inyectan hacia adentro (adapters -> application -> domain).
import { loadConfig } from './infrastructure/config/env';
import { ConsoleLogger } from './infrastructure/logger/console.logger';
import { createApp } from './infrastructure/http/app';

const config = loadConfig();
const logger = new ConsoleLogger('booking-service');
const app = createApp({ logger });

app.listen(config.port, () => {
  logger.info('booking-service listening', { port: config.port, env: config.nodeEnv });
});