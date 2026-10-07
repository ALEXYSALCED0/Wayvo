import { z } from 'zod';

export const apiErrorDetailSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  details: z.unknown().optional(),
});

export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    message: z.string().optional(),
    error: apiErrorDetailSchema.optional(),
  });

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const correlationHeaderSchema = z.object({
  'x-correlation-id': z.string().uuid().or(z.string().min(1)).optional(),
});
