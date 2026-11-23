/**
 * Contratos de la suscripción PREMIUM (payment-service, a través del API Gateway).
 *
 * Solo hay un plan de pago: PREMIUM, USD 4.95 al mes. La cuenta cambia de FREE a PREMIUM
 * cuando la Saga de activación termina bien (POST /subscriptions/:id/activate).
 */

export type SubscriptionStatus = 'INCOMPLETE' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED';

// GET /api/v1/payments/plan
export interface PremiumPlanInfo {
  code: 'PREMIUM';
  amountCents: number;
  currency: string;
  interval: 'month';
}

export interface SubscriptionDTO {
  id: string;
  plan: 'PREMIUM';
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}

// GET /api/v1/payments/subscriptions/me
export interface MySubscriptionDTO {
  plan: 'FREE' | 'PREMIUM';
  subscription: SubscriptionDTO | null;
}

// POST /api/v1/payments/subscriptions
export interface CreateSubscriptionResponse {
  subscription: SubscriptionDTO;
  // Para montar el Payment Element de Stripe en el navegador. null con el simulador (PAYMENTS_MODE=mock).
  clientSecret: string | null;
}

// Códigos de error de POST /subscriptions/:id/activate
export enum ActivationFailureCode {
  PAYMENT_NOT_COMPLETED = 'PAYMENT_NOT_COMPLETED', // 402: todavía no se cobró
  SAGA_COMPENSATED = 'SAGA_COMPENSATED', // 409: se cobró pero la cuenta falló; se devolvió el dinero
  COMPENSATION_FAILED = 'COMPENSATION_FAILED', // 500: hay que revisar el reembolso manualmente
}
