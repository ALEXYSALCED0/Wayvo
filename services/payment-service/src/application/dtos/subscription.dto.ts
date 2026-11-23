import { PlanCode, Subscription, SubscriptionStatus } from '../../domain/entities/subscription';

export interface SubscriptionOutput {
  id: string;
  plan: PlanCode;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}

export interface CreateSubscriptionOutput {
  subscription: SubscriptionOutput;
  // Para inicializar el Payment Element en el navegador. null en el simulador.
  clientSecret: string | null;
}

export function toSubscriptionOutput(s: Subscription): SubscriptionOutput {
  return {
    id: s.id,
    plan: s.plan,
    status: s.status,
    currentPeriodEnd: s.currentPeriodEnd ? s.currentPeriodEnd.toISOString() : null,
    cancelAtPeriodEnd: s.cancelAtPeriodEnd,
    createdAt: s.createdAt.toISOString(),
  };
}
