import { CheckAvailabilityItemInput } from './availability.dto';

export interface ConfirmProviderReservationRequest {
  bookingId: string;
  items: CheckAvailabilityItemInput[];
}

export interface ConfirmProviderReservationResponse {
  reservationCode: string;
  confirmationCode?: string;
  confirmedAt?: string;
  bookingId?: string;
}
