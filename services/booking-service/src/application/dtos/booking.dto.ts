import { Booking } from '../../domain/entities/booking';
import { BookingItemType } from '../../domain/value-objects/booking-item-type';

// DTOs: lo que entra y sale de los casos de uso. Son datos planos, sin
// comportamiento, para que los controllers no manipulen entidades del dominio.

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
  status: string;
  totalAmount: number;
  cancellationReason: string | null;
  items: BookingItemOutput[];
  createdAt: string;
  updatedAt: string;
}

export function toBookingOutput(booking: Booking): BookingOutput {
  return {
    id: booking.id,
    tripId: booking.tripId,
    userId: booking.userId,
    currency: booking.currency,
    status: booking.status,
    totalAmount: booking.totalAmount(),
    cancellationReason: booking.cancellationReason,
    items: booking.items.map((item) => ({
      ...item.toPrimitives(),
      subtotal: item.subtotal(),
    })),
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
  };
}