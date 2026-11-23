import { Subscription } from '../../domain/entities/subscription';
import { SubscriptionRepository } from '../../domain/repositories/subscription.repository';
import { CreateSubscriptionOutput, toSubscriptionOutput } from '../dtos/subscription.dto';
import { AlreadySubscribedError } from '../errors/application.error';
import { IdGenerator } from '../ports/id-generator.port';
import { LoggerPort } from '../ports/logger.port';
import { IPaymentGateway } from '../ports/payment-gateway.port';

export interface CreateSubscriptionInput {
  userId: string;
  email: string;
  name?: string;
  correlationId?: string;
}

// Paso 1 de la suscripción: crea la suscripción PREMIUM en la pasarela, todavía sin pagar
// (INCOMPLETE), y devuelve el secreto con el que el navegador cobra la tarjeta.
export class CreateSubscriptionUseCase {
  constructor(
    private readonly subscriptions: SubscriptionRepository,
    private readonly gateway: IPaymentGateway,
    private readonly ids: IdGenerator,
    private readonly logger: LoggerPort,
  ) {}

  async execute(input: CreateSubscriptionInput): Promise<CreateSubscriptionOutput> {
    const previous = await this.subscriptions.findLatestByUserId(input.userId);

    if (previous?.isActive) throw new AlreadySubscribedError();

    // Un intento anterior sin pagar se descarta para no dejar suscripciones huérfanas.
    if (previous?.isPending) {
      try {
        await this.gateway.cancelSubscription(previous.providerSubscriptionRef, { refund: false });
      } catch (error) {
        this.logger.warn('Could not cancel the previous unpaid subscription', {
          correlationId: input.correlationId,
          subscriptionId: previous.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      previous.markCanceled();
      await this.subscriptions.save(previous);
    }

    const id = this.ids.generate();
    const created = await this.gateway.createSubscription({
      userId: input.userId,
      email: input.email,
      name: input.name,
      idempotencyKey: `wayvo-sub-${id}`,
    });

    const subscription = Subscription.create({
      id,
      userId: input.userId,
      email: input.email,
      providerCustomerRef: created.customerRef,
      providerSubscriptionRef: created.subscriptionRef,
      state: created,
    });
    await this.subscriptions.save(subscription);

    // Nunca se loguea el clientSecret.
    this.logger.info('Subscription created', {
      correlationId: input.correlationId,
      subscriptionId: id,
      userId: input.userId,
      status: subscription.status,
    });
    return { subscription: toSubscriptionOutput(subscription), clientSecret: created.clientSecret };
  }
}
