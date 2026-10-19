import { Provider } from '../../../domain/entities/provider';
import { ServiceOffer } from '../../../domain/entities/service-offer';
import { ProviderType } from '../../../domain/value-objects/provider-type';
import { ServiceOfferType } from '../../../domain/value-objects/service-offer-type';
import { VerificationStatus } from '../../../domain/value-objects/verification-status';


export interface DecimalLike {
  toNumber(): number;
}

export interface ProviderRow {
  id: string;
  name: string;
  type: string;
  verificationStatus: string;
  verificationNote: string | null;
  contactEmail: string;
  contactPhone: string | null;
  rating: DecimalLike | null;
  websiteUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceOfferRow {
  id: string;
  providerId: string;
  type: string;
  title: string;
  description: string;
  unitPrice: DecimalLike;
  currency: string;
  availableCapacity: number;
  active: boolean;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}

// Datos listos para escribir
export interface ProviderData {
  id: string;
  name: string;
  type: ProviderType;
  verificationStatus: VerificationStatus;
  verificationNote: string | null;
  contactEmail: string;
  contactPhone: string | null;
  rating: number | null;
  websiteUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceOfferData {
  id: string;
  providerId: string;
  type: ServiceOfferType;
  title: string;
  description: string;
  unitPrice: number;
  currency: string;
  availableCapacity: number;
  active: boolean;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export const ProviderMapper = {
  toDomain(row: ProviderRow): Provider {
    return Provider.restore({
      id: row.id,
      name: row.name,
      type: row.type as ProviderType,
      verificationStatus: row.verificationStatus as VerificationStatus,
      verificationNote: row.verificationNote,
      contactEmail: row.contactEmail,
      contactPhone: row.contactPhone,
      rating: row.rating ? row.rating.toNumber() : null,
      websiteUrl: row.websiteUrl,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  },

  toData(provider: Provider): ProviderData {
    return provider.toPrimitives();
  },
};

export const ServiceOfferMapper = {
  toDomain(row: ServiceOfferRow): ServiceOffer {
    return ServiceOffer.restore({
      id: row.id,
      providerId: row.providerId,
      type: row.type as ServiceOfferType,
      title: row.title,
      description: row.description,
      unitPrice: row.unitPrice.toNumber(),
      currency: row.currency,
      availableCapacity: row.availableCapacity,
      active: row.active,
      metadata: toMetadata(row.metadata),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  },

  toData(offer: ServiceOffer): ServiceOfferData {
    return offer.toPrimitives();
  },
};

// si no guarda un objeto, la oferta queda sin metadata
function toMetadata(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}
