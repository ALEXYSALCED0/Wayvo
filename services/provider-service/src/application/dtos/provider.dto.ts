import { Provider } from '../../domain/entities/provider';

export interface VerifyProviderInput {
  providerId: string;
  // true = verificar y false = rechazar (ahi reason es obligatorio)
  approved: boolean;
  reason?: string;
}

export interface ProviderOutput {
  id: string;
  name: string;
  type: string;
  verificationStatus: string;
  verificationNote: string | null;
  contactEmail: string;
  contactPhone: string | null;
  rating: number | null;
  websiteUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toProviderOutput(provider: Provider): ProviderOutput {
  return {
    id: provider.id,
    name: provider.name,
    type: provider.type,
    verificationStatus: provider.verificationStatus,
    verificationNote: provider.verificationNote,
    contactEmail: provider.contactEmail,
    contactPhone: provider.contactPhone,
    rating: provider.rating,
    websiteUrl: provider.websiteUrl,
    createdAt: provider.createdAt.toISOString(),
    updatedAt: provider.updatedAt.toISOString(),
  };
}
