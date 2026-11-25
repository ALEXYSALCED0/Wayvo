import { SubscriptionRepository } from '../../domain/repositories/subscription.repository';
import { AccountPlanGateway } from '../ports/account-plan.gateway';
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
    private readonly accounts: AccountPlanGateway,
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

    // El plan de la cuenta sigue al estado de la suscripción MÁS RECIENTE del usuario:
    // un evento atrasado de una suscripción vieja no debe quitarle el plan a la nueva.
    // Si auth-service falla, el error sube (502) y Stripe reintenta el webhook; repetirlo es seguro.
    const latest = await this.subscriptions.findLatestByUserId(subscription.userId);
    if (latest?.id === subscription.id) {
      await this.accounts.setPlan(
        {
          userId: subscription.userId,
          plan: subscription.isActive ? 'PREMIUM' : 'FREE',
          subscriptionId: subscription.id,
          currentPeriodEnd: subscription.isActive ? subscription.currentPeriodEnd : null,
        },
        input.correlationId,
      );
    }
    this.logger.info('Subscription updated by webhook', {
      correlationId: input.correlationId,
      subscriptionId: subscription.id,
      status: subscription.status,
    });
    return true;
  }
}
