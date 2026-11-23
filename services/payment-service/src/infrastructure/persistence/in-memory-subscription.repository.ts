import { Subscription } from '../../domain/entities/subscription';
import { SubscriptionRepository } from '../../domain/repositories/subscription.repository';

// Persistencia en memoria: se pierde al reiniciar. La versión con PostgreSQL
// (payment-db) implementa la misma interfaz y se agrega en una parte aparte.
export class InMemorySubscriptionRepository implements SubscriptionRepository {
  private readonly items = new Map<string, Subscription>();

  async save(subscription: Subscription): Promise<void> {
    this.items.set(subscription.id, subscription);
  }

  async findById(id: string): Promise<Subscription | null> {
    return this.items.get(id) ?? null;
  }

  async findLatestByUserId(userId: string): Promise<Subscription | null> {
    const own = [...this.items.values()].filter((s) => s.userId === userId);
    own.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return own[0] ?? null;
  }

  async findByProviderSubscriptionRef(ref: string): Promise<Subscription | null> {
    return [...this.items.values()].find((s) => s.providerSubscriptionRef === ref) ?? null;
  }
}
