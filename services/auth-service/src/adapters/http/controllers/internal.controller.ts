import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AccountPlan } from '../../../domain/entities/user';
import { SetAccountPlanUseCase } from '../../../application/use-cases/set-account-plan.use-case';
import { parseBody } from '../validation/validate';

const setPlanSchema = z.object({
  plan: z.enum([AccountPlan.FREE, AccountPlan.PREMIUM]),
  subscriptionId: z.string().min(1).nullable().optional(),
  currentPeriodEnd: z.iso.datetime().nullable().optional(),
});

// Rutas internas (servicio a servicio). Solo las usa payment-service.
export class InternalController {
  constructor(private readonly setAccountPlan: SetAccountPlanUseCase) {}

  setPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = parseBody(setPlanSchema, req.body);
      const user = await this.setAccountPlan.execute({
        userId: String(req.params.id),
        plan: body.plan,
        subscriptionId: body.subscriptionId ?? null,
        planExpiresAt: body.currentPeriodEnd ? new Date(body.currentPeriodEnd) : null,
        correlationId: res.locals.correlationId,
      });
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  };
}
