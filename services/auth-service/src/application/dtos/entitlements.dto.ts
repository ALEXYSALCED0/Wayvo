import { User } from '../../domain/entities/user';
import { PlanEntitlements } from '../../domain/policies/plan-policy';
import { UsageWindow } from '../../domain/services/usage-window';

// Qué puede hacer la cuenta y cuánto lleva usado este mes (coincide con AccountEntitlements de @wayvo/contracts).
export interface EntitlementsOutput {
  plan: string;
  aiPlans: {
    // null = ilimitado (PREMIUM)
    limit: number | null;
    used: number;
    remaining: number | null;
    // Mes calendario que se está contando, "2026-11"
    period: string;
    // Cuándo se renuevan los planes (inicio del mes siguiente)
    resetsAt: string;
  };
  luxuryBudget: boolean;
}

export function toEntitlementsOutput(
  user: User,
  entitlements: PlanEntitlements,
  used: number,
  window: UsageWindow,
): EntitlementsOutput {
  const limit = entitlements.aiPlansPerMonth;
  return {
    plan: user.plan,
    aiPlans: {
      limit,
      used,
      remaining: limit === null ? null : Math.max(0, limit - used),
      period: window.period,
      resetsAt: window.resetsAt.toISOString(),
    },
    luxuryBudget: entitlements.luxuryBudget,
  };
}
