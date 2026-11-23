// ADAPTEE: la forma de Stripe tal como viene (nombres, anidación, estados).
// Solo se declaran los campos que Wayvo lee. Hay dos implementaciones:
//   - StripeHttpApi (infrastructure/stripe): llama a la API real de Stripe
//   - FakeStripeApi (infrastructure/mock): simulador local, sin red ni claves

export type StripeSubscriptionStatus =
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'paused';

export interface StripeSubscription {
  id: string;
  customer: string;
  status: StripeSubscriptionStatus;
  cancel_at_period_end: boolean;
  // Desde la versión basil de la API, el periodo vive en cada item (en segundos Unix).
  items?: { data: Array<{ current_period_end?: number }> };
  // Con expand=latest_invoice.confirmation_secret llega el objeto; si no, solo el id.
  latest_invoice?: string | { confirmation_secret?: { client_secret?: string } | null } | null;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: { object: unknown };
}

export interface StripeApi {
  createCustomer(input: {
    email: string;
    name?: string;
    userId: string;
    idempotencyKey: string;
  }): Promise<{ id: string }>;

  createSubscription(input: {
    customerId: string;
    userId: string;
    idempotencyKey: string;
  }): Promise<StripeSubscription>;

  retrieveSubscription(subscriptionId: string): Promise<StripeSubscription>;

  // Cancela de inmediato (no al final del periodo).
  cancelSubscription(subscriptionId: string): Promise<StripeSubscription>;

  // Devuelve el dinero del último pago de la suscripción. false si no había nada que devolver.
  refundLatestPayment(subscriptionId: string): Promise<boolean>;

  // Verifica la firma con el secreto del webhook y devuelve el evento.
  // Lanza InvalidWebhookSignatureError si no es válida.
  constructWebhookEvent(rawBody: string, signature: string | undefined): StripeWebhookEvent;
}
