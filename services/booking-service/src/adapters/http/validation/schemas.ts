import { z } from 'zod';
import { BookingItemType } from '../../../domain/value-objects/booking-item-type';

// Validación de forma (tipos, campos obligatorios) en el borde HTTP.
// Las reglas de negocio (por ejemplo, "al menos un item") siguen en el dominio.

const itemSchema = z.object({
  type: z.enum(BookingItemType),
  providerId: z.string().min(1),
  offerId: z.string().min(1),
  description: z.string().default(''),
  quantity: z.number().int(),
  unitPrice: z.number(),
});

export const createBookingSchema = z.object({
  tripId: z.string().min(1),
  userId: z.string().min(1),
  currency: z.string().length(3).default('COP'),
  items: z.array(itemSchema),
});

export const cancelBookingSchema = z.object({
  reason: z.string().min(1).default('Cancelled by user'),
});

export const confirmTripSchema = z.object({
  userId: z.string().min(1),
  currency: z.string().length(3).default('COP'),
  trip: z.object({
    destination: z.string().min(1),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
  }),
  items: z.array(itemSchema),
});