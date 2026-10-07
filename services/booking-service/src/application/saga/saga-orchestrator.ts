import { CompensationLog, SagaStep, StepOutcome } from '../../domain/entities/compensation-log';
import { CompensationLogRepository } from '../../domain/repositories/compensation-log.repository';
import { IdGenerator } from '../ports/id-generator.port';
import { LoggerPort } from '../ports/logger.port';
import { ProviderServiceGateway } from '../ports/provider-service.gateway';
import { TripServiceGateway } from '../ports/trip-service.gateway';
import { CancelBookingUseCase } from '../use-cases/cancel-booking.use-case';
import { ConfirmBookingUseCase } from '../use-cases/confirm-booking.use-case';
import { CreateBookingUseCase } from '../use-cases/create-booking.use-case';
import { ConfirmTripSagaInput, ConfirmTripSagaResult } from './confirm-trip-saga.types';

// Una compensación pendiente: qué paso deshace y cómo.
interface Compensation {
  step: SagaStep;
  run: () => Promise<void>;
}

class SagaStepError extends Error {
  constructor(readonly step: SagaStep, message: string) {
    super(message);
  }
}

// Orquestador central de la Saga "confirmar viaje".
//
// Flujo feliz:  CREATE_TRIP -> CREATE_BOOKING -> RESERVE_PROVIDER -> CONFIRM
// Si un paso falla: no se sigue hacia adelante y se ejecutan las compensaciones
// de los pasos ya completados en orden inverso (pila LIFO), dejando la traza en
// CompensationLog.
export class SagaOrchestrator {
  constructor(
    private readonly trips: TripServiceGateway,
    private readonly providers: ProviderServiceGateway,
    private readonly createBooking: CreateBookingUseCase,
    private readonly confirmBooking: ConfirmBookingUseCase,
    private readonly cancelBooking: CancelBookingUseCase,
    private readonly compensationLogs: CompensationLogRepository,
    private readonly ids: IdGenerator,
    private readonly logger: LoggerPort,
  ) {}

  async confirmTrip(input: ConfirmTripSagaInput): Promise<ConfirmTripSagaResult> {
    const correlationId = input.correlationId ?? this.ids.generate();
    const compensations: Compensation[] = [];
    let tripId: string | null = null;
    let bookingId: string | null = null;
    let reservationCode: string | null = null;

    this.log('Saga started', correlationId, null, 'STARTED');

    try {
      // a. trip-service crea el viaje en PENDING
      tripId = await this.step(correlationId, SagaStep.CREATE_TRIP, async () => {
        const { tripId: id } = await this.trips.createPendingTrip(
          { ...input.trip, userId: input.userId },
          correlationId,
        );
        return id;
      });
      const createdTripId = tripId;
      compensations.push({
        step: SagaStep.COMPENSATE_TRIP,
        run: () => this.trips.cancelTrip(createdTripId, 'Saga compensation', correlationId),
      });

      // b. booking-service (este servicio) crea la reserva en PENDING
      const booking = await this.step(correlationId, SagaStep.CREATE_BOOKING, () =>
        this.createBooking.execute({
          tripId: createdTripId,
          userId: input.userId,
          currency: input.currency,
          items: input.items,
        }),
      );
      bookingId = booking.id;
      compensations.push({
        step: SagaStep.COMPENSATE_BOOKING,
        run: async () => {
          await this.cancelBooking.execute({ bookingId: booking.id, reason: 'Saga compensation' });
        },
      });

      // c. provider-service verifica y bloquea disponibilidad externa
      reservationCode = await this.step(correlationId, SagaStep.RESERVE_PROVIDER, async () => {
        const result = await this.providers.reserve(
          { bookingId: booking.id, items: booking.items },
          correlationId,
        );
        if (!result.available) {
          throw new Error(`Provider unavailable: ${result.reason}`);
        }
        return result.reservationCode;
      });
      // provider-service no expone un endpoint de liberación en el MVP, así que
      // este paso no apila compensación. Si se agrega, se registraría aquí.

      // d. todo salió bien: marcar reserva y viaje como CONFIRMED
      await this.step(correlationId, SagaStep.CONFIRM, async () => {
        await this.confirmBooking.execute(booking.id);
        await this.trips.confirmTrip(createdTripId, correlationId);
      });

      this.log('Saga completed', correlationId, null, 'CONFIRMED', { tripId, bookingId });
      return {
        correlationId, status: 'CONFIRMED', tripId, bookingId, reservationCode,
        failedStep: null, reason: null,
      };
    } catch (error) {
      const failedStep = error instanceof SagaStepError ? error.step : SagaStep.CONFIRM;
      const reason = error instanceof Error ? error.message : String(error);
      const fullyCompensated = await this.compensate(
        correlationId, compensations, failedStep, reason, tripId, bookingId,
      );
      return {
        correlationId,
        status: fullyCompensated ? 'COMPENSATED' : 'COMPENSATION_FAILED',
        tripId, bookingId, reservationCode, failedStep, reason,
      };
    }
  }

  // Ejecuta un paso hacia adelante, logueando inicio, éxito o fallo.
  private async step<T>(correlationId: string, step: SagaStep, action: () => Promise<T>): Promise<T> {
    this.log('Saga step', correlationId, step, 'STARTED');
    try {
      const result = await action();
      this.log('Saga step', correlationId, step, 'SUCCEEDED');
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.log('Saga step', correlationId, step, 'FAILED', { error: message });
      throw new SagaStepError(step, message);
    }
  }

  // Deshace los pasos completados en orden inverso. Si una compensación falla,
  // se registra y se sigue con las demás: hay que liberar todo lo posible.
  private async compensate(
    correlationId: string,
    compensations: Compensation[],
    failedStep: SagaStep,
    reason: string,
    tripId: string | null,
    bookingId: string | null,
  ): Promise<boolean> {
    const log = CompensationLog.open({
      id: this.ids.generate(), correlationId, tripId, bookingId, failedStep, reason,
    });

    for (const compensation of [...compensations].reverse()) {
      this.log('Saga compensation', correlationId, compensation.step, 'STARTED');
      try {
        await compensation.run();
        log.record(compensation.step, StepOutcome.SUCCEEDED);
        this.log('Saga compensation', correlationId, compensation.step, 'SUCCEEDED');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        log.record(compensation.step, StepOutcome.FAILED, message);
        this.log('Saga compensation', correlationId, compensation.step, 'FAILED', { error: message });
      }
    }

    await this.compensationLogs.save(log);
    // Si no había nada que compensar (falló el primer paso), también es consistente.
    const consistent = compensations.length === 0 || log.isFullyCompensated();
    this.log('Saga finished with compensation', correlationId, failedStep, consistent ? 'COMPENSATED' : 'COMPENSATION_FAILED');
    return consistent;
  }

  private log(
    message: string,
    correlationId: string,
    step: SagaStep | null,
    status: string,
    extra: Record<string, unknown> = {},
  ): void {
    const meta = { correlationId, step, status, ...extra };
    if (status === 'FAILED' || status === 'COMPENSATION_FAILED') this.logger.error(message, meta);
    else if (status === 'COMPENSATED') this.logger.warn(message, meta);
    else this.logger.info(message, meta);
  }
}