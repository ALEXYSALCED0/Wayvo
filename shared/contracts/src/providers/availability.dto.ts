import { BookingItemType } from '../bookings/booking.dto';

export interface CheckAvailabilityItemInput {
  type: BookingItemType;
  providerId: string;
  offerId: string;
  quantity: number;
}

export interface CheckAvailabilityRequest {
  items: CheckAvailabilityItemInput[];
}

export interface ItemAvailabilityDetail {
  offerId: string;
  providerId: string;
  available: boolean;
  remainingCapacity?: number;
  reason?: string;
}

export interface CheckAvailabilityResponse {
  available: boolean;
  reason?: string;
  details?: ItemAvailabilityDetail[];
}
