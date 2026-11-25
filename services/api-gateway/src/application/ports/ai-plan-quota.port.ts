import { AccountEntitlements } from '@wayvo/contracts';

export interface AiPlanQuotaDecision {
  allowed: boolean;
  // true = se descontó un plan del mes (hay que devolverlo si la generación falla)
  counted: boolean;
  // AiPlanDenialCode cuando allowed = false
  code?: string;
  message?: string;
  entitlements: AccountEntitlements;
}

// Puerto: el gateway necesita "pedir permiso para generar un plan con IA", sin saber
// dónde se guardan los planes ni cómo se cuentan (eso es de auth-service).
export interface AiPlanQuotaPort {
  consume(userId: string, budgetCategory: string | undefined, correlationId: string): Promise<AiPlanQuotaDecision>;
  // Devuelve el plan descontado (la generación falló). Si falla, no debe romper la respuesta.
  release(userId: string, period: string, correlationId: string): Promise<void>;
}
