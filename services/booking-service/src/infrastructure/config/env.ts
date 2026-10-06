import 'dotenv/config';

export interface AppConfig {
  port: number;
  nodeEnv: string;
  tripServiceUrl: string;
  providerServiceUrl: string;
}

export function loadConfig(): AppConfig {
  return {
    port: Number(process.env.PORT ?? 3001),
    nodeEnv: process.env.NODE_ENV ?? 'development',
    tripServiceUrl: process.env.TRIP_SERVICE_URL ?? 'http://localhost:3003',
    providerServiceUrl: process.env.PROVIDER_SERVICE_URL ?? 'http://localhost:3002',
  };
}