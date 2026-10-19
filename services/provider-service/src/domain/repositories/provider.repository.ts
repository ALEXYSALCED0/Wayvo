import { Provider } from '../entities/provider';
import { ProviderType } from '../value-objects/provider-type';
import { VerificationStatus } from '../value-objects/verification-status';

export interface ProviderFilter {
  type?: ProviderType;
  verificationStatus?: VerificationStatus;
}

export interface ProviderRepository {
  save(provider: Provider): Promise<void>;
  findById(id: string): Promise<Provider | null>;
  // Ordenados por nombre
  findAll(filter?: ProviderFilter): Promise<Provider[]>;
}
