import { z } from 'zod';
import { ProviderType } from '../../domain/value-objects/provider-type';
import { ServiceOfferType } from '../../domain/value-objects/service-offer-type';
import { VerificationStatus } from '../../domain/value-objects/verification-status';

// Replica esquemas de @wayvo/contracts (provider.schemas.ts)
const itemSchema = z.object({
  type: z.nativeEnum(ServiceOfferType),
  providerId: z.string().min(1),
  offerId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const checkAvailabilityBodySchema = z.object({
  items: z.array(itemSchema).min(1),
});

export const confirmReservationBodySchema = z.object({
  bookingId: z.string().min(1),
  items: z.array(itemSchema).min(1),
});

export const listProvidersQuerySchema = z.object({
  type: z.nativeEnum(ProviderType).optional(),
  verificationStatus: z.nativeEnum(VerificationStatus).optional(),
  includeOffers: z.enum(['true', 'false']).optional(),
});

export class RequestValidationError extends Error {
  readonly code = 'VALIDATION_ERROR';

  constructor(readonly details: Array<{ path: string; message: string }>) {
    super('Invalid request');
    this.name = 'RequestValidationError';
  }
}

export function parseOrThrow<S extends z.ZodType>(schema: S, value: unknown): z.infer<S> {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  throw new RequestValidationError(
    result.error.issues.map((issue) => ({
      path: issue.path.map(String).join('.'),
      message: issue.message,
    })),
  );
}
