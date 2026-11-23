import { vi } from 'vitest';
import { AccountEntitlements, AccountPlan } from '@wayvo/contracts';
import { AiPlanQuotaDecision, AiPlanQuotaPort } from '../src/application/ports/ai-plan-quota.port';

export const entitlementsOf = (plan: AccountPlan, used = 0): AccountEntitlements => ({
  plan,
  aiPlans: {
    limit: plan === AccountPlan.PREMIUM ? null : 5,
    used,
    remaining: plan === AccountPlan.PREMIUM ? null : 5 - used,
    period: '2026-11',
    resetsAt: '2026-12-01T05:00:00.000Z',
  },
  luxuryBudget: plan === AccountPlan.PREMIUM,
});

// Cuota falsa que deja pasar todo (para los tests que no hablan de planes).
export const allowAllQuota = (): AiPlanQuotaPort => ({
  consume: vi.fn().mockResolvedValue({ allowed: true, counted: false, entitlements: entitlementsOf(AccountPlan.PREMIUM) }),
  release: vi.fn().mockResolvedValue(undefined),
});

export const quotaReturning = (decision: AiPlanQuotaDecision): AiPlanQuotaPort => ({
  consume: vi.fn().mockResolvedValue(decision),
  release: vi.fn().mockResolvedValue(undefined),
});
