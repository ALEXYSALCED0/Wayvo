import { Prisma, PrismaClient } from './prisma-client';
import { ServiceOffer } from '../../../domain/entities/service-offer';
import { ServiceOfferRepository } from '../../../domain/repositories/service-offer.repository';
import { ServiceOfferMapper } from './provider.mapper';

export class PrismaServiceOfferRepository implements ServiceOfferRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(offer: ServiceOffer): Promise<void> {
    const { id, providerId, metadata, availableCapacity, ...fields } = ServiceOfferMapper.toData(offer);
    const json = metadata as Prisma.InputJsonObject;
    await this.prisma.serviceOffer.upsert({
      where: { id },
      create: { id, ...fields, availableCapacity, metadata: json, provider: { connect: { id: providerId } } },
      // Sin availableCapacity: el cupo solo cambia con tryReserve/releaseCapacity.
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

  // Se traduce a una sola sentencia SQL:
  //   UPDATE service_offers
  //      SET available_capacity = available_capacity - $q
  //    WHERE id = $id AND active AND available_capacity >= $q
  // PostgreSQL bloquea la fila mientras la actualiza: si dos usuarios piden el
  // último cupo a la vez, la segunda sentencia ya ve el cupo en 0, no cumple el
  // WHERE y no modifica nada (count = 0). Así nunca se vende dos veces el mismo cupo.
  async tryReserve(offerId: string, quantity: number): Promise<boolean> {
    const { count } = await this.prisma.serviceOffer.updateMany({
      where: { id: offerId, active: true, availableCapacity: { gte: quantity } },
      data: { availableCapacity: { decrement: quantity }, updatedAt: new Date() },
    });
    return count === 1;
  }

  async releaseCapacity(offerId: string, quantity: number): Promise<void> {
    await this.prisma.serviceOffer.updateMany({
      where: { id: offerId },
      data: { availableCapacity: { increment: quantity }, updatedAt: new Date() },
    });
  }

  async resetCapacity(offerId: string, capacity: number): Promise<void> {
    await this.prisma.serviceOffer.updateMany({
      where: { id: offerId },
      data: { availableCapacity: capacity, updatedAt: new Date() },
    });
  }
}
