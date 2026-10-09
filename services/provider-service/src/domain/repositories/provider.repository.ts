import { Provider } from '../entities/provider';

export interface ProviderRepository {
  save(provider: Provider): Promise<void>;
  findById(id: string): Promise<Provider | null>;
}
