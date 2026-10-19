import { Prisma, PrismaClient } from './prisma-client';
import { ServiceOffer } from '../../../domain/entities/service-offer';
import { ServiceOfferRepository } from '../../../domain/repositories/service-offer.repository';
import { ServiceOfferMapper } from './provider.mapper';

export class PrismaServiceOfferRepository implements ServiceOfferRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(offer: ServiceOffer): Promise<void> {
    const { id, providerId, metadata, ...fields } = ServiceOfferMapper.toData(offer);
    const json = metadata as Prisma.InputJsonObject;
    await this.prisma.serviceOffer.upsert({
      where: { id },
      create: { id, ...fields, metadata: json, provider: { connect: { id: providerId } } },
      update: { ...fields, metadata: json },
    });
  }

  async findById(id: string): Promise<ServiceOffer | null> {
    const row = await this.prisma.serviceOffer.findUnique({ where: { id } });
    return row ? ServiceOfferMapper.toDomain(row) : null;
  }

  async findByProviderId(providerId: string): Promise<ServiceOffer[]> {
    const rows = await this.prisma.serviceOffer.findMany({
      where: { providerId },
      orderBy: { title: 'asc' },
    });
    return rows.map((row) => ServiceOfferMapper.toDomain(row));
  }
}
