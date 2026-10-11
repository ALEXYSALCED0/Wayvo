import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaClient } from '../../../src/infrastructure/persistence/prisma/prisma-client';
import { createPrismaClient } from '../../../src/infrastructure/persistence/prisma/prisma.client';
import { PrismaProviderRepository } from '../../../src/infrastructure/persistence/prisma/prisma-provider.repository';
import { PrismaServiceOfferRepository } from '../../../src/infrastructure/persistence/prisma/prisma-service-offer.repository';
import { seedCatalog } from '../../../src/infrastructure/persistence/seed/seed-catalog';
import { SEED_PROVIDERS } from '../../../src/infrastructure/persistence/seed/catalog-seed-data';
import { ProviderType } from '../../../src/domain/value-objects/provider-type';
import { VerificationStatus } from '../../../src/domain/value-objects/verification-status';
import { makeOffer, makeProvider } from '../domain/fixtures';

// Prueba de integración contra PostgreSQL real, borra el contenido de las tablas providers y service_offers
//   docker compose up -d provider-db
//   cd services/provider-service && npx prisma migrate deploy
//   TEST_DATABASE_URL="postgresql://wayvo:wayvo@localhost:5434/provider_db?schema=public" npx vitest run prisma-repositories
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('repositorios Prisma (PostgreSQL)', () => {
  let prisma: PrismaClient;
  let providers: PrismaProviderRepository;
  let offers: PrismaServiceOfferRepository;

  beforeAll(() => {
    prisma = createPrismaClient(url);
    providers = new PrismaProviderRepository(prisma);
    offers = new PrismaServiceOfferRepository(prisma);
  });
  beforeEach(async () => {
    await prisma.serviceOffer.deleteMany();
    await prisma.provider.deleteMany();
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('guarda y recupera un proveedor', async () => {
    const provider = makeProvider({ rating: 4.5, contactPhone: '123' });
    provider.verify();
    await providers.save(provider);

    const found = await providers.findById('prov-1');
    expect(found?.toPrimitives()).toEqual(provider.toPrimitives());
  });

  it('save actualiza si ya existe (cambio de verificación)', async () => {
    const provider = makeProvider();
    await providers.save(provider);
    provider.reject('Sin licencia');
    await providers.save(provider);

    const found = await providers.findById('prov-1');
    expect(found?.verificationStatus).toBe(VerificationStatus.REJECTED);
    expect(found?.verificationNote).toBe('Sin licencia');
  });

  it('findById devuelve null si no existe', async () => {
    expect(await providers.findById('nope')).toBeNull();
    expect(await offers.findById('nope')).toBeNull();
  });

  it('guarda una oferta con su metadata y la actualiza al reservar cupo', async () => {
    await providers.save(makeProvider());
    const offer = makeOffer({ metadata: { flightNumber: 'WY100', originAirport: 'BOG' } });
    await offers.save(offer);

    const loaded = (await offers.findById('offer-1'))!;
    expect(loaded.metadata).toEqual({ flightNumber: 'WY100', originAirport: 'BOG' });
    loaded.reserve(3);
    await offers.save(loaded);

    expect((await offers.findById('offer-1'))!.availableCapacity).toBe(7);
  });

  it('una oferta sin proveedor existente se rechaza (clave foránea)', async () => {
    await expect(offers.save(makeOffer())).rejects.toThrow();
  });

  it('el seed completo se carga y es idempotente', async () => {
    const first = await seedCatalog(providers, offers);
    const second = await seedCatalog(providers, offers);

    expect(first.providersCreated).toBe(SEED_PROVIDERS.length);
    expect(second.providersCreated + second.offersCreated).toBe(0);
    expect(await providers.findAll({ type: ProviderType.TRANSPORT })).toHaveLength(3);
    expect((await offers.findByProviderId('prov-aerocaribe')).length).toBe(2);
  });
});
