import { SubscriptionStatus } from '../../domain/entities/subscription';
import { SubscriptionRepository } from '../../domain/repositories/subscription.repository';
import { SubscriptionOutput, toSubscriptionOutput } from '../dtos/subscription.dto';
import { SubscriptionNotFoundError } from '../errors/application.error';
import { LoggerPort } from '../ports/logger.port';
import { IPaymentGateway } from '../ports/payment-gateway.port';

export interface CancelSubscriptionInput {
  userId: string;
  subscriptionId: string;
  // true = además devolver el último pago (compensación de la Saga de suscripción).
  refund?: boolean;
  correlationId?: string;
}

export interface CancelSubscriptionOutput {
  subscription: SubscriptionOutput;
  refunded: boolean;
}

// Cancela la suscripción en la pasarela. Es la COMPENSACIÓN de la Saga: si se cobró
// pero no se pudo activar el plan en la cuenta, se cancela y se devuelve el dinero.
// Es idempotente: cancelar una suscripción ya cancelada no vuelve a llamar a la pasarela.
export class CancelSubscriptionUseCase {
  constructor(
    private readonly subscriptions: SubscriptionRepository,
    private readonly gateway: IPaymentGateway,
    private readonly logger: LoggerPort,
  ) {}

  async execute(input: CancelSubscriptionInput): Promise<CancelSubscriptionOutput> {
    const subscription = await this.subscriptions.findById(input.subscriptionId);
    if (!subscription || subscription.userId !== input.userId) throw new SubscriptionNotFoundError();

    if (subscription.status === SubscriptionStatus.CANCELED) {
      return { subscription: toSubscriptionOutput(subscription), refunded: false };
    }

    const result = await this.gateway.cancelSubscription(subscription.providerSubscriptionRef, {
      refund: input.refund === true,
    });
    subscription.markCanceled();
    await this.subscriptions.save(subscription);

    this.logger.info('Subscription canceled', {
      correlationId: input.correlationId,
      subscriptionId: subscription.id,
      refunded: result.refunded,
    });
    return { subscription: toSubscriptionOutput(subscription), refunded: result.refunded };
  }
}
