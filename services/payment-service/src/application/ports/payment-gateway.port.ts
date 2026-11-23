import { ProviderSubscriptionState } from '../../domain/entities/subscription';

// TARGET del patrón Adapter: el contrato que Wayvo espera de CUALQUIER pasarela de pago.
// Los casos de uso solo conocen esta interfaz; Stripe (u otra pasarela) queda detrás de
// un Adapter que traduce.

export interface CreateGatewaySubscriptionRequest {
  userId: string;
  email: string;
  name?: string;
  // Misma clave = misma operación: evita crear dos suscripciones si se reintenta.
  idempotencyKey: string;
}

export interface GatewaySubscription extends ProviderSubscriptionState {
  customerRef: string;
  subscriptionRef: string;
}

export interface CreatedGatewaySubscription extends GatewaySubscription {
  // Lo necesita el navegador (Stripe Payment Element) para cobrar. Es sensible:
  // se devuelve al cliente una vez y nunca se guarda ni se loguea.
  clientSecret: string | null;
}

export interface CancelGatewaySubscriptionOptions {
  // Devolver el último pago (compensación cuando algo falla después de cobrar).
  refund: boolean;
}

export interface CancelGatewaySubscriptionResult {
  canceled: true;
  refunded: boolean;
}

// Cambio de estado que la pasarela notifica por webhook.
export interface PaymentWebhookEvent {
  type: 'SUBSCRIPTION_UPDATED';
  subscription: GatewaySubscription;
}

export interface IPaymentGateway {
  createSubscription(request: CreateGatewaySubscriptionRequest): Promise<CreatedGatewaySubscription>;
  getSubscription(subscriptionRef: string): Promise<GatewaySubscription>;
  cancelSubscription(
    subscriptionRef: string,
    options: CancelGatewaySubscriptionOptions,
  ): Promise<CancelGatewaySubscriptionResult>;
  // Verifica la firma y traduce el evento. Devuelve null si es un evento que no nos interesa.
  // Lanza InvalidWebhookSignatureError si la firma no es válida.
  parseWebhookEvent(rawBody: string, signature: string | undefined): Promise<PaymentWebhookEvent | null>;
}
