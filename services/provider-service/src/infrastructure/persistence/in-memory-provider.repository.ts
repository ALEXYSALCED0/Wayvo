import { Provider } from '../../domain/entities/provider';
import { ProviderRepository } from '../../domain/repositories/provider.repository';

// Memoria del puerto ProviderRepository, para tests y correr el servicio (temporalmente)
export class InMemoryProviderRepository implements ProviderRepository {
  private readonly store = new Map<string, Provider>();

  async save(provider: Provider): Promise<void> {
    this.store.set(provider.id, Provider.restore(provider.toPrimitives()));
  }

  async findById(id: string): Promise<Provider | null> {
    const found = this.store.get(id);
    return found ? Provider.restore(found.toPrimitives()) : null;
  }
}
