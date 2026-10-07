import { z } from 'zod';
import { BookingItemType, BookingStatus } from './booking.dto';
import { SagaStep, StepOutcome } from './compensation.dto';

export const bookingStatusSchema = z.nativeEnum(BookingStatus);
export const bookingItemTypeSchema = z.nativeEnum(BookingItemType);
export const sagaStepSchema = z.nativeEnum(SagaStep);
export const stepOutcomeSchema = z.nativeEnum(StepOutcome);

export const createBookingItemSchema = z.object({
  type: bookingItemTypeSchema,
  providerId: z.string().min(1),
  offerId: z.string().min(1),
  description: z.string().default(''),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
});

export const createBookingSchema = z.object({
  tripId: z.string().min(1),
  userId: z.string().min(1),
  currency: z.string().length(3).default('COP'),
  items: z.array(createBookingItemSchema).min(1),
});

export const cancelBookingSchema = z.object({
  reason: z.string().min(1).default('Cancelled by user'),
});

export const confirmTripSagaSchema = z.object({
  userId: z.string().min(1),
  currency: z.string().length(3).default('COP'),
  trip: z.object({
    destination: z.string().min(1),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    origin: z.string().optional(),
    title: z.string().optional(),
    travelers: z.number().int().positive().optional(),
  }),
  items: z.array(createBookingItemSchema).min(1),
});

export const compensationLogEntrySchema = z.object({
  step: sagaStepSchema,
  outcome: stepOutcomeSchema,
  detail: z.string().nullable().optional(),
  at: z.string().datetime().or(z.date()),
});

export const compensationLogSchema = z.object({
  id: z.string().min(1),
  correlationId: z.string().min(1),
  tripId: z.string().nullable().optional(),
  bookingId: z.string().nullable().optional(),
  failedStep: sagaStepSchema,
  reason: z.string().min(1),
  entries: z.array(compensationLogEntrySchema),
  createdAt: z.string().datetime().or(z.date()),
});
