import { SubscriptionRepository } from '../../domain/repositories/subscription.repository';
import { SubscriptionOutput, toSubscriptionOutput } from '../dtos/subscription.dto';
import { SubscriptionNotFoundError } from '../errors/application.error';
import { LoggerPort } from '../ports/logger.port';
import { IPaymentGateway } from '../ports/payment-gateway.port';

export interface ConfirmSubscriptionInput {
  userId: string;
  subscriptionId: string;
  correlationId?: string;
}

// Paso 2: después de que el navegador cobró, se le pregunta a la pasarela cómo quedó.
// No se confía en lo que diga el cliente: el estado sale de la pasarela.
// Que el pago no haya entrado NO es un error: se devuelve el estado (INCOMPLETE, PAST_DUE...)
// y quien llama decide qué hacer.
export class ConfirmSubscriptionUseCase {
  constructor(
    private readonly subscriptions: SubscriptionRepository,
    private readonly gateway: IPaymentGateway,
    private readonly logger: LoggerPort,
  ) {}

  async execute(input: ConfirmSubscriptionInput): Promise<SubscriptionOutput> {
    const subscription = await this.subscriptions.findById(input.subscriptionId);
    if (!subscription || subscription.userId !== input.userId) throw new SubscriptionNotFoundError();

    const state = await this.gateway.getSubscription(subscription.providerSubscriptionRef);
    subscription.syncWith(state);
    await this.subscriptions.save(subscription);

    this.logger.info('Subscription confirmation checked', {
      correlationId: input.correlationId,
      subscriptionId: subscription.id,
      status: subscription.status,
    });
    return toSubscriptionOutput(subscription);
  }
}
