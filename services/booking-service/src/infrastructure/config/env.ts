import 'dotenv/config';
import { FakeProviderMode } from '../../adapters/gateways/fake/fake-provider-service.gateway';

export type ServicesMode = 'http' | 'fake';

export interface AppConfig {
  port: number;
  nodeEnv: string;
  databaseUrl: string | null;
  servicesMode: ServicesMode;
  fakeProviderMode: FakeProviderMode;
  tripServiceUrl: string;
  providerServiceUrl: string;
  httpTimeoutMs: number;
}

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    port: Number(env.PORT ?? 3001),
    nodeEnv: env.NODE_ENV ?? 'development',
    databaseUrl: env.DATABASE_URL || null,
    servicesMode: oneOf(env.SERVICES_MODE, ['http', 'fake'] as const, 'http'),
    fakeProviderMode: oneOf(env.FAKE_PROVIDER_MODE, ['ok', 'unavailable', 'error'] as const, 'ok'),
    tripServiceUrl: env.TRIP_SERVICE_URL ?? 'http://localhost:3003',
    providerServiceUrl: env.PROVIDER_SERVICE_URL ?? 'http://localhost:3002',
    httpTimeoutMs: Number(env.HTTP_TIMEOUT_MS ?? 5000),
  };
}