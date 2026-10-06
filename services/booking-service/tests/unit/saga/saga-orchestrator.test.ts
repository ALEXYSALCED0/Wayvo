import { SagaOrchestrator } from '../../../src/application/saga/saga-orchestrator';
import { CancelBookingUseCase } from '../../../src/application/use-cases/cancel-booking.use-case';
import { ConfirmBookingUseCase } from '../../../src/application/use-cases/confirm-booking.use-case';
import { CreateBookingUseCase } from '../../../src/application/use-cases/create-booking.use-case';
import { SagaStep, StepOutcome } from '../../../src/domain/entities/compensation-log';
import { BookingStatus } from '../../../src/domain/value-objects/booking-status';
import { InMemoryBookingRepository } from '../../../src/infrastructure/persistence/in-memory-booking.repository';
import { InMemoryCompensationLogRepository } from '../../../src/infrastructure/persistence/in-memory-compensation-log.repository';
import { createBookingInput, SequentialIdGenerator, silentLogger } from '../application/helpers';
import { FakeProviderService, FakeTripService } from './fakes';

describe('SagaOrchestrator.confirmTrip', () => {
  let trips: FakeTripService;
  let providers: FakeProviderService;
  let bookings: InMemoryBookingRepository;
  let logs: InMemoryCompensationLogRepository;
  let saga: SagaOrchestrator;

  const input = () => {
    const { userId, currency, items } = createBookingInput();
    return {
      correlationId: 'corr-1',
      userId,
      currency,
      items,
      trip: { destination: 'Cartagena', startDate: '2026-12-01', endDate: '2026-12-03' },
    };
  };

  beforeEach(() => {
    trips = new FakeTripService();
    providers = new FakeProviderService();
    bookings = new InMemoryBookingRepository();
    logs = new InMemoryCompensationLogRepository();
    const ids = new SequentialIdGenerator();
    saga = new SagaOrchestrator(
      trips,
      providers,
      new CreateBookingUseCase(bookings, ids, silentLogger),
      new ConfirmBookingUseCase(bookings, silentLogger),
      new CancelBookingUseCase(bookings, silentLogger),
      logs,
      ids,
      silentLogger,
    );
  });

  it('flujo feliz: confirma viaje y reserva', async () => {
    const result = await saga.confirmTrip(input());

    expect(result.status).toBe('CONFIRMED');
    expect(result.reservationCode).toBe('RSV-001');
    expect(trips.status.get('trip-1')).toBe('CONFIRMED');
    expect((await bookings.findById(result.bookingId!))?.status).toBe(BookingStatus.CONFIRMED);
    expect(await logs.findByCorrelationId('corr-1')).toBeNull();
  });

  it('proveedor sin disponibilidad: cancela reserva y luego viaje (orden inverso)', async () => {
    providers.mode = 'unavailable';

    const result = await saga.confirmTrip(input());

    expect(result.status).toBe('COMPENSATED');
    expect(result.failedStep).toBe(SagaStep.RESERVE_PROVIDER);
    expect((await bookings.findById(result.bookingId!))?.status).toBe(BookingStatus.CANCELLED);
    expect(trips.status.get('trip-1')).toBe('CANCELLED');
    expect(trips.calls).not.toContain('confirmTrip');

    const log = await logs.findByCorrelationId('corr-1');
    expect(log?.failedStep).toBe(SagaStep.RESERVE_PROVIDER);
    expect(log?.reason).toContain('No rooms left');
    expect(log?.entries.map((e) => e.step)).toEqual([
      SagaStep.COMPENSATE_BOOKING,
      SagaStep.COMPENSATE_TRIP,
    ]);
  });

  it('provider-service caído: compensa igual que si no hubiera disponibilidad', async () => {
    providers.mode = 'error';

    const result = await saga.confirmTrip(input());

    expect(result.status).toBe('COMPENSATED');
    expect(result.reason).toContain('503');
    expect(trips.status.get('trip-1')).toBe('CANCELLED');
  });

  it('si falla el primer paso no hay nada que compensar', async () => {
    trips.failOn = 'create';

    const result = await saga.confirmTrip(input());

    expect(result.status).toBe('COMPENSATED');
    expect(result.failedStep).toBe(SagaStep.CREATE_TRIP);
    expect(result.bookingId).toBeNull();
    expect(providers.requests).toHaveLength(0);
    expect((await logs.findByCorrelationId('corr-1'))?.entries).toHaveLength(0);
  });

  it('si falla la confirmación del viaje, también deshace la reserva ya confirmada', async () => {
    trips.failOn = 'confirm';

    const result = await saga.confirmTrip(input());

    expect(result.status).toBe('COMPENSATED');
    expect(result.failedStep).toBe(SagaStep.CONFIRM);
    expect((await bookings.findById(result.bookingId!))?.status).toBe(BookingStatus.CANCELLED);
    expect(trips.status.get('trip-1')).toBe('CANCELLED');
  });

  it('si una compensación falla, sigue con las demás y reporta COMPENSATION_FAILED', async () => {
    providers.mode = 'unavailable';
    trips.failOn = 'cancel';

    const result = await saga.confirmTrip(input());

    expect(result.status).toBe('COMPENSATION_FAILED');
    expect((await bookings.findById(result.bookingId!))?.status).toBe(BookingStatus.CANCELLED);
    const log = await logs.findByCorrelationId('corr-1');
    expect(log?.entries.map((e) => [e.step, e.outcome])).toEqual([
      [SagaStep.COMPENSATE_BOOKING, StepOutcome.SUCCEEDED],
      [SagaStep.COMPENSATE_TRIP, StepOutcome.FAILED],
    ]);
  });

  it('genera un correlationId si no viene en la entrada', async () => {
    const { correlationId: _ignored, ...rest } = input();
    const result = await saga.confirmTrip(rest);
    expect(result.correlationId).toBeTruthy();
  });
});