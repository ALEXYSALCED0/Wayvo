import { Express } from 'express';
import { loadConfig } from '../../../src/infrastructure/config/env';
import { buildContainer, ContainerOverrides } from '../../../src/infrastructure/container';
import { createApp } from '../../../src/infrastructure/http/app';
import { InMemoryBookingRepository } from '../../../src/infrastructure/persistence/in-memory-booking.repository';
import { InMemoryCompensationLogRepository } from '../../../src/infrastructure/persistence/in-memory-compensation-log.repository';
import { SequentialIdGenerator, silentLogger } from '../../unit/application/helpers';
import { FakeProviderService, FakeTripService } from '../../unit/saga/fakes';

export interface TestApp {
  app: Express;
  trips: FakeTripService;
  providers: FakeProviderService;
}

// App completa (rutas + middlewares + casos de uso) con dependencias en memoria.
export function buildTestApp(overrides: ContainerOverrides = {}): TestApp {
  const trips = new FakeTripService();
  const providers = new FakeProviderService();
  const container = buildContainer(loadConfig({}), silentLogger, {
    bookings: new InMemoryBookingRepository(),
    compensationLogs: new InMemoryCompensationLogRepository(),
    ids: new SequentialIdGenerator(),
    trips,
    providers,
    ...overrides,
  });
  return { app: createApp(container), trips, providers };
}