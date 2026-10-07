import { SagaStep } from '../../domain/entities/compensation-log';
import { CreateBookingItemInput } from '../dtos/booking.dto';
import { TripDraft } from '../ports/trip-service.gateway';

export interface ConfirmTripSagaInput {
  correlationId?: string;
  userId: string;
  currency: string;
  trip: Omit<TripDraft, 'userId'>;
  items: CreateBookingItemInput[];
}

export type SagaFinalStatus = 'CONFIRMED' | 'COMPENSATED' | 'COMPENSATION_FAILED';

export interface ConfirmTripSagaResult {
  correlationId: string;
  status: SagaFinalStatus;
  tripId: string | null;
  bookingId: string | null;
  reservationCode: string | null;
  failedStep: SagaStep | null;
  reason: string | null;
}