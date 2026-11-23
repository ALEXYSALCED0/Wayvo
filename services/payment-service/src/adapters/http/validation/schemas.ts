import { z } from 'zod';

export const createSubscriptionBodySchema = z.object({
  email: z.email(),
  name: z.string().trim().min(1).max(120).optional(),
});

export const cancelSubscriptionBodySchema = z.object({
  // true = devolver también el último pago (compensación de la Saga).
  refund: z.boolean().optional(),
});
