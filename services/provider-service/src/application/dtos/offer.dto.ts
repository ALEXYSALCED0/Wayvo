import { ServiceOffer } from '../../domain/entities/service-offer';

export interface ServiceOfferOutput {
  id: string;
  providerId: string;
  type: string;
  title: string;
  description: string;
  unitPrice: number;
  currency: string;
  availableCapacity: number;
  active: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export function toServiceOfferOutput(offer: ServiceOffer): ServiceOfferOutput {
  return {
    id: offer.id,
    providerId: offer.providerId,
    type: offer.type,
    title: offer.title,
    description: offer.description,
    unitPrice: offer.unitPrice,
    currency: offer.currency,
    availableCapacity: offer.availableCapacity,
    active: offer.active,
    metadata: { ...offer.metadata },
    createdAt: offer.createdAt.toISOString(),
    updatedAt: offer.updatedAt.toISOString(),
  };
}
