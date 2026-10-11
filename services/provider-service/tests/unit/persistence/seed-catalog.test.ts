import { describe, expect, it } from 'vitest';
import { InMemoryProviderRepository } from '../../../src/infrastructure/persistence/in-memory-provider.repository';
import { InMemoryServiceOfferRepository } from '../../../src/infrastructure/persistence/in-memory-service-offer.repository';
import { buildPersistence } from '../../../src/infrastructure/persistence/persistence';
import { SEED_PROVIDERS, buildSeedOffers } from '../../../src/infrastructure/persistence/seed/catalog-seed-data';
import { seedCatalog } from '../../../src/infrastructure/persistence/seed/seed-catalog';
import { MockInventory } from '../../../src/infrastructure/mock/mock-inventory';
import { ProviderType } from '../../../src/domain/value-objects/provider-type';
import { ServiceOfferType } from '../../../src/domain/value-objects/service-offer-type';
import { VerificationStatus } from '../../../src/domain/value-objects/verification-status';

const now = new Date('2026-10-10T10:00:00Z');
const fresh = () => ({ providers: new InMemoryProviderRepository(), offers: new InMemoryServiceOfferRepository() });

describe('catálogo precargado', () => {
  it('carga todos los proveedores y ofertas', async () => {
    const { providers, offers } = fresh();
    const result = await seedCatalog(providers, offers, { now });

    expect(result).toEqual({
      providersCreated: SEED_PROVIDERS.length, providersSkipped: 0,
      offersCreated: buildSeedOffers(now).length, offersSkipped: 0,
    });
    expect(await providers.findAll()).toHaveLength(SEED_PROVIDERS.length);
  });

  it('cubre los estados de verificación y los tipos de proveedor', async () => {
    const { providers, offers } = fresh();
    await seedCatalog(providers, offers, { now });

    const verified = await providers.findAll({ verificationStatus: VerificationStatus.VERIFIED });
    const pending = await providers.findAll({ verificationStatus: VerificationStatus.PENDING });
    const rejected = await providers.findAll({ verificationStatus: VerificationStatus.REJECTED });
    expect(verified.length).toBeGreaterThan(0);
    expect(pending).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].verificationNote).toBeTruthy();
    expect(new Set(verified.map((p) => p.type))).toEqual(new Set(Object.values(ProviderType)));
  });

  it('es idempotente: repetirlo no pisa cupos ni verificaciones', async () => {
    const { providers, offers } = fresh();
    await seedCatalog(providers, offers, { now });

    const offer = (await offers.findById('offer-aerocaribe-bog-ctg-am'))!;
    offer.reserve(5);
    await offers.save(offer);
    const pending = (await providers.findById('prov-brisas-hostal'))!;
    pending.verify();
    await providers.save(pending);

    const again = await seedCatalog(providers, offers, { now });
    expect(again.providersCreated + again.offersCreated).toBe(0);
    expect((await offers.findById('offer-aerocaribe-bog-ctg-am'))!.availableCapacity).toBe(25);
    expect((await providers.findById('prov-brisas-hostal'))!.isVerified()).toBe(true);
  });

  it('--force restaura el estado inicial', async () => {
    const { providers, offers } = fresh();
    await seedCatalog(providers, offers, { now });
    const offer = (await offers.findById('offer-aerocaribe-bog-ctg-am'))!;
    offer.reserve(5);
    await offers.save(offer);

    await seedCatalog(providers, offers, { now, force: true });
    expect((await offers.findById('offer-aerocaribe-bog-ctg-am'))!.availableCapacity).toBe(30);
  });

  it('toda oferta pertenece a un proveedor del catálogo y su tipo es compatible', async () => {
    const byId = new Map(SEED_PROVIDERS.map((p) => [p.id, p]));
    for (const offer of buildSeedOffers(now)) {
      const provider = byId.get(offer.providerId);
      expect(provider, offer.id).toBeDefined();
      if (offer.type === ServiceOfferType.TRANSPORT) expect(provider!.type).toBe(ProviderType.TRANSPORT);
      if (offer.type === ServiceOfferType.ACCOMMODATION) expect(provider!.type).toBe(ProviderType.ACCOMMODATION);
    }
  });

  it('los ids son únicos', () => {
    const ids = [...SEED_PROVIDERS.map((p) => p.id), ...buildSeedOffers(now).map((o) => o.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('las ofertas externas existen en el simulador (vuelo y hotel reservables)', () => {
    const inventory = new MockInventory();
    for (const offer of buildSeedOffers(now)) {
      const m = offer.metadata as Record<string, string>;
      if (offer.type === ServiceOfferType.TRANSPORT) {
        const flights = inventory.flights({
          originAirport: m.originAirport, destinationAirport: m.destinationAirport, departureDate: m.departureDate,
        });
        expect(flights.map((f) => f.flightNumber), offer.id).toContain(m.flightNumber);
      }
      if (offer.type === ServiceOfferType.ACCOMMODATION) {
        const hotels = inventory.hotels(m.cityCode, m.checkInDate, m.checkOutDate);
        expect(hotels.map((h) => h.hotelCode), offer.id).toContain(m.hotelCode);
        expect(m.checkOutDate > m.checkInDate).toBe(true);
      }
    }
  });

  it('las fechas del viaje salen del día del seed', () => {
    const flight = buildSeedOffers(now).find((o) => o.type === ServiceOfferType.TRANSPORT)!;
    expect(flight.metadata.departureDate).toBe('2026-12-09');
  });
});

describe('buildPersistence', () => {
  it('sin DATABASE_URL usa memoria con el catálogo cargado', async () => {
    const persistence = await buildPersistence(undefined);
    expect(persistence.kind).toBe('in-memory');
    expect((await persistence.providers.findAll()).length).toBe(SEED_PROVIDERS.length);
    expect((await persistence.offers.findByProviderId('prov-aerocaribe')).length).toBe(2);
    await persistence.shutdown();
  });
});
