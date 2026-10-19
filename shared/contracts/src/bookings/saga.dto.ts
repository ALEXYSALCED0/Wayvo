import { TripDraft } from '../trips/trip.dto';
import { CreateBookingItemInput } from './booking.dto';
import { SagaStep } from './compensation.dto';

export type SagaFinalStatus = 'CONFIRMED' | 'COMPENSATED' | 'COMPENSATION_FAILED';

export interface ConfirmTripSagaInput {
  correlationId?: string;
  userId: string;
  currency: string;
  trip: Omit<TripDraft, 'userId'>;
  items: CreateBookingItemInput[];
}

export interface ConfirmTripSagaResult {
  correlationId: string;
  status: SagaFinalStatus;
  tripId: string | null;
  bookingId: string | null;
  reservationCode: string | null;
  failedStep: SagaStep | null;
  reason: string | null;
}
