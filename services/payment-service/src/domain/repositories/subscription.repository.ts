import { Subscription } from '../entities/subscription';

export interface SubscriptionRepository {
  save(subscription: Subscription): Promise<void>;
  findById(id: string): Promise<Subscription | null>;
  // La más reciente del usuario (puede estar cancelada).
  findLatestByUserId(userId: string): Promise<Subscription | null>;
  findByProviderSubscriptionRef(ref: string): Promise<Subscription | null>;
}
