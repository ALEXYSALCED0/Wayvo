import { PlanPolicy } from '../../domain/policies/plan-policy';
import { AiPlanUsageRepository } from '../../domain/repositories/ai-plan-usage.repository';
import { UserRepository } from '../../domain/repositories/user.repository';
import { usageWindow } from '../../domain/services/usage-window';
import { EntitlementsOutput, toEntitlementsOutput } from '../dtos/entitlements.dto';
import { AccountNotFoundError } from '../errors/application.error';
import { LoggerPort } from '../ports/logger.port';

export type AiPlanDenialCode = 'LUXURY_BUDGET_REQUIRES_PREMIUM' | 'AI_PLAN_LIMIT_REACHED';

export interface ConsumeAiPlanInput {
  userId: string;
  budgetCategory?: string;
  correlationId?: string;
}

export interface ConsumeAiPlanOutput {
  allowed: boolean;
  // true = se descontó un plan del mes (hay que devolverlo si la generación falla).
  counted: boolean;
  code?: AiPlanDenialCode;
  message?: string;
  entitlements: EntitlementsOutput;
}

// El gateway lo llama ANTES de generar un plan con IA. Aquí se decide:
//   - FREE no puede pedir presupuesto "Lujo".
//   - FREE tiene N planes por mes calendario (N = FREE_AI_PLANS_PER_MONTH, 5 por defecto).
//   - PREMIUM: sin límite y con todos los presupuestos (no se cuenta nada).
export class ConsumeAiPlanUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly usage: AiPlanUsageRepository,
    private readonly policy: PlanPolicy,
    private readonly timeZone: string,
    private readonly logger: LoggerPort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: ConsumeAiPlanInput): Promise<ConsumeAiPlanOutput> {
    const user = await this.users.findById(input.userId);
    if (!user) throw new AccountNotFoundError();

    const entitlements = this.policy.for(user.plan);
    const window = usageWindow(this.now(), this.timeZone);
    const snapshot = async () =>
      toEntitlementsOutput(user, entitlements, await this.usage.getUsed(user.id, window.period), window);

    if (!entitlements.luxuryBudget && this.policy.isLuxury(input.budgetCategory)) {
      this.logger.info('AI plan denied: luxury budget', { correlationId: input.correlationId, userId: user.id });
      return {
        allowed: false,
        counted: false,
        code: 'LUXURY_BUDGET_REQUIRES_PREMIUM',
        message: 'El presupuesto de lujo es solo para cuentas PREMIUM',
        entitlements: await snapshot(),
      };
    }

    // PREMIUM: sin límite, no se cuenta.
    if (entitlements.aiPlansPerMonth === null) {
      return { allowed: true, counted: false, entitlements: await snapshot() };
    }

    const consumed = await this.usage.tryConsume(user.id, window.period, entitlements.aiPlansPerMonth);
    if (!consumed) {
      this.logger.info('AI plan denied: monthly limit', {
        correlationId: input.correlationId,
        userId: user.id,
        period: window.period,
      });
      return {
        allowed: false,
        counted: false,
        code: 'AI_PLAN_LIMIT_REACHED',
        message: `Ya usaste tus ${entitlements.aiPlansPerMonth} planes de IA de este mes`,
        entitlements: await snapshot(),
      };
    }

    return { allowed: true, counted: true, entitlements: await snapshot() };
  }
}
