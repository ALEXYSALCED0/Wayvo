import {
  Booking as BookingRow,
  BookingItem as BookingItemRow,
  Prisma,
} from '@prisma/client';
import { Booking } from '../../../domain/entities/booking';
import { BookingItem } from '../../../domain/entities/booking-item';
import { BookingItemType } from '../../../domain/value-objects/booking-item-type';
import { BookingStatus } from '../../../domain/value-objects/booking-status';

// El mapper traduce entre filas de la base de datos y entidades del dominio.
// Así el dominio no sabe que existen Prisma, Decimal ni nombres de columnas.

type BookingWithItems = BookingRow & { items: BookingItemRow[] };

export const BookingMapper = {
  toDomain(row: BookingWithItems): Booking {
    return Booking.restore({
      id: row.id,
      tripId: row.tripId,
      userId: row.userId,
      currency: row.currency,
      status: row.status as BookingStatus,
      cancellationReason: row.cancellationReason,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      items: row.items.map((item) =>
        BookingItem.create({
          id: item.id,
          type: item.type as BookingItemType,
          providerId: item.providerId,
          offerId: item.offerId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toNumber(),
        }),
      ),
    });
  },

  toCreateInput(booking: Booking): Prisma.BookingCreateInput {
    return {
      id: booking.id,
      tripId: booking.tripId,
      userId: booking.userId,
      currency: booking.currency,
      status: booking.status,
      cancellationReason: booking.cancellationReason,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      items: {
        create: booking.items.map((item) => ({
          id: item.id,
          type: item.type,
          providerId: item.providerId,
          offerId: item.offerId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: new Prisma.Decimal(item.unitPrice),
        })),
      },
    };
  },

  // Después de creada, una reserva solo cambia de estado (los items son fijos).
  toUpdateInput(booking: Booking): Prisma.BookingUpdateInput {
    return {
      status: booking.status,
      cancellationReason: booking.cancellationReason,
      updatedAt: booking.updatedAt,
    };
  },
};