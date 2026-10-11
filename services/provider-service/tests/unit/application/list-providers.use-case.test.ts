import { describe, expect, it } from 'vitest';
import { ListProvidersUseCase } from '../../../src/application/use-cases/list-providers.use-case';
import { ProviderType } from '../../../src/domain/value-objects/provider-type';
import { VerificationStatus } from '../../../src/domain/value-objects/verification-status';
import { InMemoryProviderRepository } from '../../../src/infrastructure/persistence/in-memory-provider.repository';
import { InMemoryServiceOfferRepository } from '../../../src/infrastructure/persistence/in-memory-service-offer.repository';
import { seedCatalog } from '../../../src/infrastructure/persistence/seed/seed-catalog';

async function setup() {
  const providers = new InMemoryProviderRepository();
  const offers = new InMemoryServiceOfferRepository();
  await seedCatalog(providers, offers);
  return new ListProvidersUseCase(providers, offers);
}

describe('ListProvidersUseCase', () => {
  it('sin filtros devuelve todo el catálogo, ordenado por nombre y sin ofertas', async () => {
    const result = await (await setup()).execute();
    expect(result).toHaveLength(8);
    expect(result.map((p) => p.name)).toEqual([...result.map((p) => p.name)].sort((a, b) => a.localeCompare(b)));
    expect(result.every((p) => p.offers === undefined)).toBe(true);
  });

  it('filtra por tipo y por estado de verificación', async () => {
    const useCase = await setup();
    const transport = await useCase.execute({ type: ProviderType.TRANSPORT });
    expect(transport.map((p) => p.id).sort()).toEqual(['prov-aerocaribe', 'prov-andes-air', 'prov-transportes-express']);

    const verifiedTransport = await useCase.execute({
      type: ProviderType.TRANSPORT, verificationStatus: VerificationStatus.VERIFIED,
    });
    expect(verifiedTransport).toHaveLength(2);
  });

  it('includeOffers agrega las ofertas de cada proveedor', async () => {
    const result = await (await setup()).execute({ includeOffers: true, type: ProviderType.ACCOMMODATION });
    const colonial = result.find((p) => p.id === 'prov-hotel-colonial')!;
    expect(colonial.offers).toHaveLength(2);
    expect(colonial.offers![0]).toMatchObject({ providerId: 'prov-hotel-colonial', currency: 'COP' });
    expect(result.find((p) => p.id === 'prov-brisas-hostal')!.offers).toEqual([]);
  });
});
