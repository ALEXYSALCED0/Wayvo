// Punto de entrada: carga la configuración, arma el contenedor (composition root)
// y levanta el servidor HTTP.
import { loadConfig } from './infrastructure/config/env';
import { buildContainer } from './infrastructure/container';
import { createApp } from './infrastructure/http/app';

const config = loadConfig();
const container = buildContainer(config);
const app = createApp(container, { nodeEnv: config.nodeEnv });

if (!config.account) {
  container.logger.warn('AUTH_SERVICE_URL no está definido: el plan se guarda en una cuenta SIMULADA en memoria (no cambia el plan real del usuario)');
}
if (config.mode === 'mock') {
  container.logger.warn('PAYMENTS_MODE=mock: no se cobra nada real (simulador de pagos). Fallos: GET /api/v1/mock/simulate-payment?mode=declined|error|slow');
} else if (!config.stripe?.webhookSecret) {
  container.logger.warn('STRIPE_WEBHOOK_SECRET no está definido: los webhooks de Stripe serán rechazados');
}

const server = app.listen(config.port, () => {
  container.logger.info('payment-service listening', {
    port: config.port,
    env: config.nodeEnv,
    mode: config.mode,
    persistence: container.persistence,
  });
});

function shutdown(signal: string): void {
  container.logger.info('Shutting down', { signal });
  server.close(() => process.exit(0));
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
