import { BudgetCategory } from '@wayvo/contracts';
import { AccountPlan } from '../entities/user';

// Lo que cada plan permite. Es la ÚNICA fuente de verdad de los límites:
// el gateway no los conoce, solo pregunta a auth-service.
export interface PlanEntitlements {
  // Planes generados por IA por mes calendario. null = ilimitado.
  aiPlansPerMonth: number | null;
  // Acceso al presupuesto "Lujo".
  luxuryBudget: boolean;
}

export class PlanPolicy {
  constructor(private readonly freeAiPlansPerMonth: number) {}

  for(plan: AccountPlan): PlanEntitlements {
    if (plan === AccountPlan.PREMIUM) return { aiPlansPerMonth: null, luxuryBudget: true };
    return { aiPlansPerMonth: this.freeAiPlansPerMonth, luxuryBudget: false };
  }

  // Tolera mayúsculas y espacios: "Lujo", "lujo " y "LUJO" son el mismo presupuesto.
  isLuxury(budgetCategory: string | undefined | null): boolean {
    return (budgetCategory ?? '').trim().toLowerCase() === BudgetCategory.LUJO.toLowerCase();
  }
}
