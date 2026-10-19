import { PrismaClient } from '@prisma/client';
import { Booking } from '../../../src/domain/entities/booking';
import { BookingItem } from '../../../src/domain/entities/booking-item';
import { CompensationLog, SagaStep, StepOutcome } from '../../../src/domain/entities/compensation-log';
import { BookingItemType } from '../../../src/domain/value-objects/booking-item-type';
import { BookingStatus } from '../../../src/domain/value-objects/booking-status';
import { PrismaBookingRepository } from '../../../src/infrastructure/persistence/prisma/prisma-booking.repository';
import { PrismaCompensationLogRepository } from '../../../src/infrastructure/persistence/prisma/prisma-compensation-log.repository';
import { createPrismaClient } from '../../../src/infrastructure/persistence/prisma/prisma.client';
import { SagaOrchestrator } from '../../../src/application/saga/saga-orchestrator';
import { CancelBookingUseCase } from '../../../src/application/use-cases/cancel-booking.use-case';
import { ConfirmBookingUseCase } from '../../../src/application/use-cases/confirm-booking.use-case';
import { CreateBookingUseCase } from '../../../src/application/use-cases/create-booking.use-case';
import { createBookingInput, SequentialIdGenerator, silentLogger } from '../../unit/application/helpers';
import { FakeProviderService, FakeTripService } from '../../unit/saga/fakes';

// Estos tests usan una base de datos real. Solo corren si existe TEST_DATABASE_URL
// (ver la guía); si no, se marcan como "skipped" y `npm test` sigue en verde.
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('Repositorios Prisma (PostgreSQL real)', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = createPrismaClient(url);
  });

  beforeEach(async () => {
    await prisma.compensationLog.deleteMany();
    await prisma.booking.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  function makeBooking(id = 'b-1'): Booking {
    return Booking.create({
      id,
      tripId: 'trip-1',
      userId: 'user-1',
      currency: 'COP',
      items: [
        BookingItem.create({
          id: `${id}-item-1`,
          type: BookingItemType.ACCOMMODATION,
          providerId: 'prov-hotel',
          offerId: 'room-1',
          description: 'Hotel, 2 noches',
          quantity: 2,
          unitPrice: 150000.5,
        }),
      ],
    });
  }

  it('guarda y recupera una reserva con sus items', async () => {
    const repo = new PrismaBookingRepository(prisma);
    await repo.save(makeBooking());

    const found = await repo.findById('b-1');

    expect(found?.status).toBe(BookingStatus.PENDING);
    expect(found?.items).toHaveLength(1);
    expect(found?.items[0].unitPrice).toBe(150000.5);
    expect(found?.totalAmount()).toBe(300001);
  });

  it('actualiza el estado al guardar de nuevo (upsert)', async () => {
    const repo = new PrismaBookingRepository(prisma);
    const booking = makeBooking();
    await repo.save(booking);

    booking.cancel('Provider unavailable');
    await repo.save(booking);

    const found = await repo.findById('b-1');
    expect(found?.status).toBe(BookingStatus.CANCELLED);
    expect(found?.cancellationReason).toBe('Provider unavailable');
    expect(found?.items).toHaveLength(1);
  });

  it('devuelve null si la reserva no existe', async () => {
    expect(await new PrismaBookingRepository(prisma).findById('nope')).toBeNull();
  });

  it('guarda y recupera un CompensationLog con sus entradas en orden', async () => {
    const repo = new PrismaCompensationLogRepository(prisma);
    const log = CompensationLog.open({
      id: 'log-1',
      correlationId: 'corr-1',
      tripId: 'trip-1',
      bookingId: 'b-1',
      failedStep: SagaStep.RESERVE_PROVIDER,
      reason: 'No rooms left',
    });
    log.record(SagaStep.COMPENSATE_BOOKING, StepOutcome.SUCCEEDED);
    log.record(SagaStep.COMPENSATE_TRIP, StepOutcome.FAILED, 'timeout');
    await repo.save(log);

    const found = await repo.findByCorrelationId('corr-1');

    expect(found?.failedStep).toBe(SagaStep.RESERVE_PROVIDER);
    expect(found?.entries.map((e) => [e.step, e.outcome, e.detail])).toEqual([
      [SagaStep.COMPENSATE_BOOKING, StepOutcome.SUCCEEDED, null],
      [SagaStep.COMPENSATE_TRIP, StepOutcome.FAILED, 'timeout'],
    ]);
  });
});

describe.skipIf(!url)('Saga con repositorios Prisma', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = createPrismaClient(url);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('la compensación queda persistida en PostgreSQL', async () => {
    await prisma.compensationLog.deleteMany();
    await prisma.booking.deleteMany();

    const bookings = new PrismaBookingRepository(prisma);
    const logs = new PrismaCompensationLogRepository(prisma);
    const ids = new SequentialIdGenerator();
    const providers = new FakeProviderService();
    providers.mode = 'unavailable';
    const saga = new SagaOrchestrator(
      new FakeTripService(),
      providers,
      new CreateBookingUseCase(bookings, ids, silentLogger),
      new ConfirmBookingUseCase(bookings, silentLogger),
      new CancelBookingUseCase(bookings, silentLogger),
      logs,
      ids,
      silentLogger,
    );
    const { userId, currency, items } = createBookingInput();

    const result = await saga.confirmTrip({
      correlationId: 'corr-db',
      userId,
      currency,
      items,
      trip: { destination: 'Cartagena', startDate: '2026-12-01', endDate: '2026-12-03' },
    });

    expect(result.status).toBe('COMPENSATED');
    expect((await bookings.findById(result.bookingId!))?.status).toBe(BookingStatus.CANCELLED);
    expect((await logs.findByCorrelationId('corr-db'))?.entries).toHaveLength(2);
  });
});