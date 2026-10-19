import { Provider } from '../../../domain/entities/provider';
import { ServiceOffer } from '../../../domain/entities/service-offer';
import { ProviderRepository } from '../../../domain/repositories/provider.repository';
import { ServiceOfferRepository } from '../../../domain/repositories/service-offer.repository';
import { VerificationStatus } from '../../../domain/value-objects/verification-status';
import { buildSeedOffers, SEED_PROVIDERS, SeedProvider } from './catalog-seed-data';

export interface SeedResult {
  providersCreated: number;
  providersSkipped: number;
  offersCreated: number;
  offersSkipped: number;
}

export interface SeedOptions { // Sobrescribe lo que ya existe
  force?: boolean;
  now?: Date;
}

// Carga el catálogo inicial por los puertos del dominio, por defecto es idempotente -> lo que ya existe no se toca.
export async function seedCatalog(
  providers: ProviderRepository,
  offers: ServiceOfferRepository,
  { force = false, now = new Date() }: SeedOptions = {},
): Promise<SeedResult> {
  const result: SeedResult = { providersCreated: 0, providersSkipped: 0, offersCreated: 0, offersSkipped: 0 };

  for (const seed of SEED_PROVIDERS) {
    if (!force && (await providers.findById(seed.id))) {
      result.providersSkipped++;
      continue;
    }
    await providers.save(buildProvider(seed, now));
    result.providersCreated++;
  }

  // Los proveedores van antes que sus ofertas (clave foránea)
  for (const seed of buildSeedOffers(now)) {
    if (!force && (await offers.findById(seed.id))) {
      result.offersSkipped++;
      continue;
    }
    await offers.save(ServiceOffer.create({ ...seed, now }));
    result.offersCreated++;
  }

  return result;
}

function buildProvider(seed: SeedProvider, now: Date): Provider {
  const provider = Provider.create({ ...seed, now });
  if (seed.status === VerificationStatus.VERIFIED) provider.verify(now);
  if (seed.status === VerificationStatus.REJECTED) provider.reject(seed.rejectionReason ?? 'Rejected', now);
  return provider;
}
