import { PrismaClient } from './prisma-client';
import { Provider } from '../../../domain/entities/provider';
import { ProviderFilter, ProviderRepository } from '../../../domain/repositories/provider.repository';
import { ProviderMapper } from './provider.mapper';

export class PrismaProviderRepository implements ProviderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(provider: Provider): Promise<void> {
    const { id, ...fields } = ProviderMapper.toData(provider);
    await this.prisma.provider.upsert({
      where: { id },
      create: { id, ...fields },
      update: fields,
    });
  }

  async findById(id: string): Promise<Provider | null> {
    const row = await this.prisma.provider.findUnique({ where: { id } });
    return row ? ProviderMapper.toDomain(row) : null;
  }

  async findAll(filter: ProviderFilter = {}): Promise<Provider[]> {
    const rows = await this.prisma.provider.findMany({
      where: {
        ...(filter.type && { type: filter.type }),
        ...(filter.verificationStatus && { verificationStatus: filter.verificationStatus }),
      },
      orderBy: { name: 'asc' },
    });
    return rows.map((row) => ProviderMapper.toDomain(row));
  }
}
