import { Provider } from '../../domain/entities/provider';
import { ProviderFilter, ProviderRepository } from '../../domain/repositories/provider.repository';

// Memoria del puerto ProviderRepository, para tests y correr el servicio sin base de datos
export class InMemoryProviderRepository implements ProviderRepository {
  private readonly store = new Map<string, Provider>();

  async save(provider: Provider): Promise<void> {
    this.store.set(provider.id, Provider.restore(provider.toPrimitives()));
  }

  async findById(id: string): Promise<Provider | null> {
    const found = this.store.get(id);
    return found ? Provider.restore(found.toPrimitives()) : null;
  }

  async findAll(filter: ProviderFilter = {}): Promise<Provider[]> {
    return [...this.store.values()]
      .filter((p) => !filter.type || p.type === filter.type)
      .filter((p) => !filter.verificationStatus || p.verificationStatus === filter.verificationStatus)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((p) => Provider.restore(p.toPrimitives()));
  }
}
