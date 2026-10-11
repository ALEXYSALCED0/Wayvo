import { ProviderRepository } from '../../domain/repositories/provider.repository';
import { ServiceOfferRepository } from '../../domain/repositories/service-offer.repository';
import { InMemoryProviderRepository } from './in-memory-provider.repository';
import { InMemoryServiceOfferRepository } from './in-memory-service-offer.repository';
import { createPrismaClient } from './prisma/prisma.client';
import { PrismaProviderRepository } from './prisma/prisma-provider.repository';
import { PrismaServiceOfferRepository } from './prisma/prisma-service-offer.repository';
import { seedCatalog } from './seed/seed-catalog';

export interface Persistence {
  providers: ProviderRepository;
  offers: ServiceOfferRepository;
  kind: 'postgres' | 'in-memory';
  shutdown(): Promise<void>;
}

// Con DATABASE_URL usa PostgreSQL (Provider DB), sin ella usa memoria con el catálogo ya cargado
export async function buildPersistence(databaseUrl?: string | null): Promise<Persistence> {
  if (databaseUrl) {
    const prisma = createPrismaClient(databaseUrl);
    return {
      providers: new PrismaProviderRepository(prisma),
      offers: new PrismaServiceOfferRepository(prisma),
      kind: 'postgres',
      shutdown: () => prisma.$disconnect(),
    };
  }

  const providers = new InMemoryProviderRepository();
  const offers = new InMemoryServiceOfferRepository();
  await seedCatalog(providers, offers);
  return { providers, offers, kind: 'in-memory', shutdown: async () => {} };
}
