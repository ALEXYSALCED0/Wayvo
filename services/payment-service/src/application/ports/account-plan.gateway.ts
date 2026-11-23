// Puerto hacia la cuenta del usuario (auth-service): el plan vive en la cuenta.
// payment-service solo pide "esta cuenta pasa a PREMIUM / vuelve a FREE"; no conoce
// cómo auth-service lo guarda.

export type AccountPlan = 'FREE' | 'PREMIUM';

export interface SetAccountPlanRequest {
  userId: string;
  plan: AccountPlan;
  subscriptionId: string;
  // Hasta cuándo está pagado el periodo (informativo, null si no aplica).
  currentPeriodEnd: Date | null;
}

export interface AccountPlanGateway {
  // Debe ser idempotente: pedir dos veces el mismo plan no cambia nada.
  // Lanza AccountServiceError si la cuenta no se pudo actualizar.
  setPlan(request: SetAccountPlanRequest, correlationId?: string): Promise<void>;
}
