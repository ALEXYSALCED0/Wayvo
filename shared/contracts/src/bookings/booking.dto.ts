export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export enum BookingItemType {
  TRANSPORT = 'TRANSPORT',
  ACCOMMODATION = 'ACCOMMODATION',
  ACTIVITY = 'ACTIVITY',
}

export interface BookingItemProps {
  id: string;
  type: BookingItemType;
  providerId: string;
  offerId: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateBookingItemInput {
  type: BookingItemType;
  providerId: string;
  offerId: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateBookingInput {
  tripId: string;
  userId: string;
  currency: string;
  items: CreateBookingItemInput[];
}

export interface CancelBookingInput {
  bookingId: string;
  reason: string;
}

export interface BookingItemOutput {
  id: string;
  type: BookingItemType;
  providerId: string;
  offerId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface BookingOutput {
  id: string;
  tripId: string;
  userId: string;
  currency: string;
  status: BookingStatus | string;
  totalAmount: number;
  cancellationReason: string | null;
  items: BookingItemOutput[];
  createdAt: string;
  updatedAt: string;
}
