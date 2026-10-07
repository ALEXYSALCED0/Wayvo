import { z } from 'zod';
import { bookingItemTypeSchema } from '../bookings/booking.schemas';
import { ProviderType, VerificationStatus } from './provider.dto';

export const verificationStatusSchema = z.nativeEnum(VerificationStatus);
export const providerTypeSchema = z.nativeEnum(ProviderType);

export const providerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: providerTypeSchema,
  verificationStatus: verificationStatusSchema.default(VerificationStatus.PENDING),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  websiteUrl: z.string().url().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const serviceOfferSchema = z.object({
  id: z.string().min(1),
  providerId: z.string().min(1),
  type: bookingItemTypeSchema,
  title: z.string().min(1),
  description: z.string().default(''),
  unitPrice: z.number().nonnegative(),
  currency: z.string().length(3).default('COP'),
  availableCapacity: z.number().int().nonnegative(),
  active: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const checkAvailabilityItemSchema = z.object({
  type: bookingItemTypeSchema,
  providerId: z.string().min(1),
  offerId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const checkAvailabilityRequestSchema = z.object({
  items: z.array(checkAvailabilityItemSchema).min(1),
});

export const checkAvailabilityResponseSchema = z.object({
  available: z.boolean(),
  reason: z.string().optional(),
  details: z.array(z.object({
    offerId: z.string(),
    providerId: z.string(),
    available: z.boolean(),
    remainingCapacity: z.number().optional(),
    reason: z.string().optional(),
  })).optional(),
});

export const confirmProviderReservationRequestSchema = z.object({
  bookingId: z.string().min(1),
  items: z.array(checkAvailabilityItemSchema).min(1),
});

export const confirmProviderReservationResponseSchema = z.object({
  reservationCode: z.string().min(1),
  confirmationCode: z.string().optional(),
  confirmedAt: z.string().optional(),
  bookingId: z.string().optional(),
});

export const mockSimulationQuerySchema = z.object({
  mode: z.enum(['normal', 'unavailable', 'slow', 'error']),
  delayMs: z.coerce.number().int().min(0).max(30000).optional(),
  failureReason: z.string().optional(),
});
