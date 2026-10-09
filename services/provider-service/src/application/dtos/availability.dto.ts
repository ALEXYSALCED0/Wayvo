import { ServiceOfferType } from '../../domain/value-objects/service-offer-type';

// siguiendo la forma de CheckAvailabilityRequest / CheckAvailabilityResponse en contracts que consume booking-service

export interface CheckAvailabilityItemInput {
  type: ServiceOfferType;
  providerId: string;
  offerId: string;
  quantity: number;
}

export interface CheckAvailabilityInput {
  items: CheckAvailabilityItemInput[];
  // Lo manda la Saga para que los logs de todos los servicios se puedan seguir juntos.
  correlationId?: string;
}

export interface ItemAvailabilityDetail {
  offerId: string;
  providerId: string;
  available: boolean;
  remainingCapacity?: number;
  reason?: string;
}

export interface CheckAvailabilityOutput {
  available: boolean;
  reason?: string;
  details: ItemAvailabilityDetail[];
}
