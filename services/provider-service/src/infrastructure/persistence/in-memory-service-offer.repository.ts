import { ServiceOffer } from '../../domain/entities/service-offer';
import { ServiceOfferRepository } from '../../domain/repositories/service-offer.repository';

export class InMemoryServiceOfferRepository implements ServiceOfferRepository {
  private readonly store = new Map<string, ServiceOffer>();

  async save(offer: ServiceOffer): Promise<void> {
    const existing = this.store.get(offer.id);
    const data = offer.toPrimitives();
    // Igual que en PostgreSQL: al actualizar se conserva el cupo guardado.
    this.store.set(
      offer.id,
      ServiceOffer.restore(existing ? { ...data, availableCapacity: existing.availableCapacity } : data),
    );
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

  // En memoria es atómico porque comprobar y descontar ocurre sin ningún `await`
  // de por medio: JavaScript no puede intercalar otra petición en ese tramo.
  async tryReserve(offerId: string, quantity: number): Promise<boolean> {
    const offer = this.store.get(offerId);
    if (!offer || !offer.hasAvailability(quantity)) return false;
    offer.reserve(quantity);
    return true;
  }

  async releaseCapacity(offerId: string, quantity: number): Promise<void> {
    this.store.get(offerId)?.release(quantity);
  }

  async resetCapacity(offerId: string, capacity: number): Promise<void> {
    const offer = this.store.get(offerId);
    if (!offer) return;
    this.store.set(offerId, ServiceOffer.restore({ ...offer.toPrimitives(), availableCapacity: capacity }));
  }
}
