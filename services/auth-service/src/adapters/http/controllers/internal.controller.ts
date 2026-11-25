import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AccountPlan } from '../../../domain/entities/user';
import { ConsumeAiPlanUseCase } from '../../../application/use-cases/consume-ai-plan.use-case';
import { ReleaseAiPlanUseCase } from '../../../application/use-cases/release-ai-plan.use-case';
import { SetAccountPlanUseCase } from '../../../application/use-cases/set-account-plan.use-case';
import { parseBody } from '../validation/validate';

const setPlanSchema = z.object({
  plan: z.enum([AccountPlan.FREE, AccountPlan.PREMIUM]),
  subscriptionId: z.string().min(1).nullable().optional(),
  currentPeriodEnd: z.iso.datetime().nullable().optional(),
});

const consumeAiPlanSchema = z.object({
  budgetCategory: z.string().max(60).optional(),
});

const releaseAiPlanSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

// Rutas internas (servicio a servicio). Solo las usa payment-service.
export class InternalController {
  constructor(
    private readonly setAccountPlan: SetAccountPlanUseCase,
    private readonly consumeAiPlan: ConsumeAiPlanUseCase,
    private readonly releaseAiPlan: ReleaseAiPlanUseCase,
  ) {}

  consume = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = parseBody(consumeAiPlanSchema, req.body ?? {});
      const result = await this.consumeAiPlan.execute({
        userId: String(req.params.id),
        budgetCategory: body.budgetCategory,
        correlationId: res.locals.correlationId,
      });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  release = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = parseBody(releaseAiPlanSchema, req.body ?? {});
      const entitlements = await this.releaseAiPlan.execute({
        userId: String(req.params.id),
        period: body.period,
        correlationId: res.locals.correlationId,
      });
      res.status(200).json({ success: true, data: { entitlements } });
    } catch (error) {
      next(error);
    }
  };

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
