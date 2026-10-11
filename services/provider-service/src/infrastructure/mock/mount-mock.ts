import type { Express } from 'express';
import { LoggerPort } from '../../application/ports/logger.port';
import { MockExternalApi, MockExternalApiOptions } from './mock-external-api';
import { MockInventory } from './mock-inventory';
import { createMockRouter } from './mock.router';
import { MockSimulationState } from './simulation-state';

export const MOCK_BASE_PATH = '/api/v1/mock';

// simulador /api/v1/mock se activa con NODE_ENV distinto de "production" y ENABLE_MOCK_API distinto de "false"
export function mountMockApi(
  app: Express,
  env: Record<string, string | undefined> = process.env,
  logger?: LoggerPort,
  options?: MockExternalApiOptions,
): MockSimulationState | undefined {
  if (env.NODE_ENV === 'production' || env.ENABLE_MOCK_API === 'false') return undefined;

  const state = new MockSimulationState(env.SIMULATE_FAILURE_MODE);
  const external = new MockExternalApi(state, new MockInventory(), options);
  app.use(MOCK_BASE_PATH, createMockRouter({ state, external, logger }));
  return state;
}
