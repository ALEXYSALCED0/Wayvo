import { ServiceOffer } from '../../domain/entities/service-offer';
import { ServiceOfferRepository } from '../../domain/repositories/service-offer.repository';

export class InMemoryServiceOfferRepository implements ServiceOfferRepository {
  private readonly store = new Map<string, ServiceOffer>();

  async save(offer: ServiceOffer): Promise<void> {
    this.store.set(offer.id, ServiceOffer.restore(offer.toPrimitives()));
  }

  async findById(id: string): Promise<ServiceOffer | null> {
    const found = this.store.get(id);
    return found ? ServiceOffer.restore(found.toPrimitives()) : null;
  }

  async findByProviderId(providerId: string): Promise<ServiceOffer[]> {
    return [...this.store.values()]
      .filter((o) => o.providerId === providerId)
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((o) => ServiceOffer.restore(o.toPrimitives()));
  }
}
