import { ServiceOffer } from '../entities/service-offer';

export interface ServiceOfferRepository {
  save(offer: ServiceOffer): Promise<void>;
  findById(id: string): Promise<ServiceOffer | null>;
  // Ordenadas por título
  findByProviderId(providerId: string): Promise<ServiceOffer[]>;
}
