import {
  SubscriptionStatus,
} from '../../domain/entities/subscription';
import {
  CancelGatewaySubscriptionOptions,
  CancelGatewaySubscriptionResult,
  CreateGatewaySubscriptionRequest,
  CreatedGatewaySubscription,
  GatewaySubscription,
  IPaymentGateway,
  PaymentWebhookEvent,
} from '../../application/ports/payment-gateway.port';
import { PaymentProviderError } from './errors';
import { StripeApi, StripeSubscription, StripeSubscriptionStatus } from './stripe-api';

// ADAPTER: hace que Stripe cumpla el contrato IPaymentGateway.
// Traduce en los dos sentidos:
//   Wayvo -> Stripe: pide cliente + suscripción con el vocabulario de Stripe
//   Stripe -> Wayvo: estados, fechas en segundos Unix y client_secret anidado pasan al formato canónico
export class StripePaymentAdapter implements IPaymentGateway {
  constructor(private readonly stripe: StripeApi) {}

  async createSubscription(request: CreateGatewaySubscriptionRequest): Promise<CreatedGatewaySubscription> {
    const customer = await this.stripe.createCustomer({
      email: request.email,
      name: request.name,
      userId: request.userId,
      idempotencyKey: `${request.idempotencyKey}:customer`,
    });
    const subscription = await this.stripe.createSubscription({
      customerId: customer.id,
      userId: request.userId,
      idempotencyKey: `${request.idempotencyKey}:subscription`,
    });
    return { ...toGatewaySubscription(subscription), clientSecret: extractClientSecret(subscription) };
  }

  async getSubscription(subscriptionRef: string): Promise<GatewaySubscription> {
    return toGatewaySubscription(await this.stripe.retrieveSubscription(subscriptionRef));
  }

  async cancelSubscription(
    subscriptionRef: string,
    options: CancelGatewaySubscriptionOptions,
  ): Promise<CancelGatewaySubscriptionResult> {
    // Primero se corta el cobro recurrente; después se devuelve el dinero.
    await this.stripe.cancelSubscription(subscriptionRef);
    const refunded = options.refund ? await this.stripe.refundLatestPayment(subscriptionRef) : false;
    return { canceled: true, refunded };
  }

  async parseWebhookEvent(rawBody: string, signature: string | undefined): Promise<PaymentWebhookEvent | null> {
    const event = this.stripe.constructWebhookEvent(rawBody, signature);
    // Los cambios de estado de la suscripción cubren activación, cobro fallido y cancelación.
    if (event.type !== 'customer.subscription.updated' && event.type !== 'customer.subscription.deleted') {
      return null;
    }
    const object = event.data.object as StripeSubscription | null;
    if (!object || typeof object !== 'object' || typeof object.id !== 'string') {
      throw new PaymentProviderError('Webhook event without a subscription object');
    }
    return { type: 'SUBSCRIPTION_UPDATED', subscription: toGatewaySubscription(object) };
  }
}

const STATUS_MAP: Record<StripeSubscriptionStatus, SubscriptionStatus> = {
  incomplete: SubscriptionStatus.INCOMPLETE,
  incomplete_expired: SubscriptionStatus.CANCELED,
  trialing: SubscriptionStatus.ACTIVE,
  active: SubscriptionStatus.ACTIVE,
  past_due: SubscriptionStatus.PAST_DUE,
  unpaid: SubscriptionStatus.PAST_DUE,
  paused: SubscriptionStatus.PAST_DUE,
  canceled: SubscriptionStatus.CANCELED,
};

export function toGatewaySubscription(sub: StripeSubscription): GatewaySubscription {
  const status = STATUS_MAP[sub.status];
  if (!status) {
    throw new PaymentProviderError(`Unknown Stripe subscription status "${String(sub.status)}"`);
  }
  return {
    subscriptionRef: sub.id,
    customerRef: sub.customer,
    status,
    currentPeriodEnd: periodEnd(sub),
    cancelAtPeriodEnd: sub.cancel_at_period_end === true,
  };
}

// Stripe informa el fin del periodo en segundos Unix, dentro de cada item.
function periodEnd(sub: StripeSubscription): Date | null {
  const seconds = sub.items?.data?.[0]?.current_period_end;
  return typeof seconds === 'number' ? new Date(seconds * 1000) : null;
}

function extractClientSecret(sub: StripeSubscription): string | null {
  const invoice = sub.latest_invoice;
  if (!invoice || typeof invoice === 'string') return null;
  return invoice.confirmation_secret?.client_secret ?? null;
}
