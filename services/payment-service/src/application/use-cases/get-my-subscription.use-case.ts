import { SubscriptionRepository } from '../../domain/repositories/subscription.repository';
import { SubscriptionOutput, toSubscriptionOutput } from '../dtos/subscription.dto';

export interface MySubscriptionOutput {
  // Plan efectivo de la cuenta: PREMIUM solo si la suscripción está activa.
  plan: 'FREE' | 'PREMIUM';
  subscription: SubscriptionOutput | null;
}

export class GetMySubscriptionUseCase {
  constructor(private readonly subscriptions: SubscriptionRepository) {}

  async execute(input: { userId: string }): Promise<MySubscriptionOutput> {
    const subscription = await this.subscriptions.findLatestByUserId(input.userId);
    if (!subscription) return { plan: 'FREE', subscription: null };
    return {
      plan: subscription.isActive ? 'PREMIUM' : 'FREE',
      subscription: toSubscriptionOutput(subscription),
    };
  }
}
