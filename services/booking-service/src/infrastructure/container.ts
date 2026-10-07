import { PrismaClient } from '@prisma/client';
import { FakeProviderServiceGateway } from '../adapters/gateways/fake/fake-provider-service.gateway';
import { FakeTripServiceGateway } from '../adapters/gateways/fake/fake-trip-service.gateway';
import { HttpClient } from '../adapters/gateways/http/http-client';
import { HttpProviderServiceGateway } from '../adapters/gateways/http/http-provider-service.gateway';
import { HttpTripServiceGateway } from '../adapters/gateways/http/http-trip-service.gateway';
import { BookingController } from '../adapters/http/controllers/booking.controller';
import { HealthController } from '../adapters/http/controllers/health.controller';
import { SagaController } from '../adapters/http/controllers/saga.controller';
import { IdGenerator } from '../application/ports/id-generator.port';
import { LoggerPort } from '../application/ports/logger.port';
import { ProviderServiceGateway } from '../application/ports/provider-service.gateway';
import { TripServiceGateway } from '../application/ports/trip-service.gateway';
import { SagaOrchestrator } from '../application/saga/saga-orchestrator';
import { CancelBookingUseCase } from '../application/use-cases/cancel-booking.use-case';
import { ConfirmBookingUseCase } from '../application/use-cases/confirm-booking.use-case';
import { CreateBookingUseCase } from '../application/use-cases/create-booking.use-case';
import { GetBookingUseCase } from '../application/use-cases/get-booking.use-case';
import { GetCompensationLogUseCase } from '../application/use-cases/get-compensation-log.use-case';
import { BookingRepository } from '../domain/repositories/booking.repository';
import { CompensationLogRepository } from '../domain/repositories/compensation-log.repository';
import { AppConfig } from './config/env';
import { UuidGenerator } from './id/uuid.generator';
import { InMemoryBookingRepository } from './persistence/in-memory-booking.repository';
import { InMemoryCompensationLogRepository } from './persistence/in-memory-compensation-log.repository';
import { PrismaBookingRepository } from './persistence/prisma/prisma-booking.repository';
import { PrismaCompensationLogRepository } from './persistence/prisma/prisma-compensation-log.repository';
import { createPrismaClient } from './persistence/prisma/prisma.client';

export interface Container {
  logger: LoggerPort;
  ids: IdGenerator;
  healthController: HealthController;
  bookingController: BookingController;
  sagaController: SagaController;
  shutdown: () => Promise<void>;
}

// Permite a los tests reemplazar piezas concretas (por ejemplo, gateways falsos).
export interface ContainerOverrides {
  bookings?: BookingRepository;
  compensationLogs?: CompensationLogRepository;
  trips?: TripServiceGateway;
  providers?: ProviderServiceGateway;
  ids?: IdGenerator;
}

// Composition root: aquí, y solo aquí, se eligen las implementaciones concretas
// de cada puerto y se conectan todas las capas.
export function buildContainer(config: AppConfig, logger: LoggerPort, overrides: ContainerOverrides = {}): Container {
  const ids = overrides.ids ?? new UuidGenerator();

  let prisma: PrismaClient | null = null;
  let bookings = overrides.bookings;
  let compensationLogs = overrides.compensationLogs;
  if (!bookings || !compensationLogs) {
    if (config.databaseUrl) {
      prisma = createPrismaClient(config.databaseUrl);
      bookings ??= new PrismaBookingRepository(prisma);
      compensationLogs ??= new PrismaCompensationLogRepository(prisma);
    } else {
      logger.warn('DATABASE_URL not set: using in-memory repositories (data is lost on restart)');
      bookings ??= new InMemoryBookingRepository();
      compensationLogs ??= new InMemoryCompensationLogRepository();
    }
  }

  let trips = overrides.trips;
  let providers = overrides.providers;
  if (config.servicesMode === 'fake') {
    logger.warn('SERVICES_MODE=fake: trip-service and provider-service are simulated', {
      fakeProviderMode: config.fakeProviderMode,
    });
    trips ??= new FakeTripServiceGateway(ids, logger);
    providers ??= new FakeProviderServiceGateway(config.fakeProviderMode);
  } else {
    trips ??= new HttpTripServiceGateway(
      new HttpClient({ service: 'trip-service', baseUrl: config.tripServiceUrl, timeoutMs: config.httpTimeoutMs }),
    );
    providers ??= new HttpProviderServiceGateway(
      new HttpClient({ service: 'provider-service', baseUrl: config.providerServiceUrl, timeoutMs: config.httpTimeoutMs }),
    );
  }

  const createBooking = new CreateBookingUseCase(bookings, ids, logger);
  const cancelBooking = new CancelBookingUseCase(bookings, logger);
  const confirmBooking = new ConfirmBookingUseCase(bookings, logger);
  const saga = new SagaOrchestrator(
    trips, providers, createBooking, confirmBooking, cancelBooking, compensationLogs, ids, logger,
  );

  return {
    logger,
    ids,
    healthController: new HealthController(),
    bookingController: new BookingController(createBooking, cancelBooking, new GetBookingUseCase(bookings)),
    sagaController: new SagaController(saga, new GetCompensationLogUseCase(compensationLogs)),
    shutdown: async () => {
      await prisma?.$disconnect();
    },
  };
}