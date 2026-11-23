import { SubscriptionRepository } from '../../domain/repositories/subscription.repository';
import { LoggerPort } from '../ports/logger.port';
import { IPaymentGateway } from '../ports/payment-gateway.port';

export interface HandleWebhookInput {
  rawBody: string;
  signature: string | undefined;
  correlationId?: string;
}

// Los cambios que pasan después (renovación mensual, cobro fallido, cancelación desde
// Stripe) llegan por webhook. Se actualiza el estado local de la suscripción.
export class HandleWebhookUseCase {
  constructor(
    private readonly subscriptions: SubscriptionRepository,
    private readonly gateway: IPaymentGateway,
    private readonly logger: LoggerPort,
  ) {}

  // Devuelve true si el evento cambió una suscripción conocida.
  async execute(input: HandleWebhookInput): Promise<boolean> {
    const event = await this.gateway.parseWebhookEvent(input.rawBody, input.signature);
    if (!event) return false;

    const subscription = await this.subscriptions.findByProviderSubscriptionRef(event.subscription.subscriptionRef);
    if (!subscription) {
      this.logger.warn('Webhook for an unknown subscription', {
        correlationId: input.correlationId,
        providerSubscriptionRef: event.subscription.subscriptionRef,
      });
      return false;
    }

    subscription.syncWith(event.subscription);
    await this.subscriptions.save(subscription);
    this.logger.info('Subscription updated by webhook', {
      correlationId: input.correlationId,
      subscriptionId: subscription.id,
      status: subscription.status,
    });
    return true;
  }
}
