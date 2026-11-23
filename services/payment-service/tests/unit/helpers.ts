import { IdGenerator } from '../../src/application/ports/id-generator.port';
import { LoggerPort } from '../../src/application/ports/logger.port';
import { AppConfig } from '../../src/infrastructure/config/env';

export const silentLogger: LoggerPort = { info: () => {}, warn: () => {}, error: () => {} };

export class SequentialIdGenerator implements IdGenerator {
  private n = 0;
  generate(): string {
    this.n += 1;
    return `id-${this.n}`;
  }
}

export const testConfig = (overrides: Partial<AppConfig> = {}): AppConfig => ({
  port: 0,
  nodeEnv: 'test',
  mode: 'mock',
  stripe: null,
  account: null,
  plan: { code: 'PREMIUM', amountCents: 495, currency: 'usd', interval: 'month' },
  ...overrides,
});
