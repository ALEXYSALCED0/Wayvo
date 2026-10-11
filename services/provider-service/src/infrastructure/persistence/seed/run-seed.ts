import 'dotenv/config';
import { createPrismaClient } from '../prisma/prisma.client';
import { PrismaProviderRepository } from '../prisma/prisma-provider.repository';
import { PrismaServiceOfferRepository } from '../prisma/prisma-service-offer.repository';
import { seedCatalog } from './seed-catalog';

// Carga catálogo inicial en la Provider DB
async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set: nothing to seed');
    process.exit(1);
  }

  const force = process.argv.includes('--force');
  const prisma = createPrismaClient(databaseUrl);
  try {
    const result = await seedCatalog(
      new PrismaProviderRepository(prisma),
      new PrismaServiceOfferRepository(prisma),
      { force },
    );
    console.log(`[seed] ${force ? 'forced' : 'incremental'}:`, result);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('[seed] failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
