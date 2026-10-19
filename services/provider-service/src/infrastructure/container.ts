import { LoggerPort } from '../application/ports/logger.port';
import { ProveedorExternoResolver } from '../application/ports/proveedor-externo-resolver.port';
import { CheckAvailabilityUseCase } from '../application/use-cases/check-availability.use-case';
import { ConfirmReservationUseCase } from '../application/use-cases/confirm-reservation.use-case';
import { ListProvidersUseCase } from '../application/use-cases/list-providers.use-case';
import { VerifyProviderUseCase } from '../application/use-cases/verify-provider.use-case';
import { createExternalProviderRegistry } from './external/external-providers.factory';
import { ConsoleLogger } from './logger/console.logger';
import { buildPersistence, Persistence } from './persistence/persistence';

export interface Container {
  logger: LoggerPort;
  listProviders: ListProvidersUseCase;
  checkAvailability: CheckAvailabilityUseCase;
  confirmReservation: ConfirmReservationUseCase;
  verifyProvider: VerifyProviderUseCase;
  persistence: Pick<Persistence, 'kind'>;
  shutdown(): Promise<void>;
}

export interface ContainerOverrides {
  logger?: LoggerPort;
  externals?: ProveedorExternoResolver;
  persistence?: Persistence;
}

// se eligen las implementaciones concretas de cada puerto.
export async function buildContainer(
  env: Record<string, string | undefined> = process.env,
  overrides: ContainerOverrides = {},
): Promise<Container> {
  const logger = overrides.logger ?? new ConsoleLogger('provider-service');
  const persistence = overrides.persistence ?? (await buildPersistence(env.DATABASE_URL));
  const externals = overrides.externals ?? buildExternals(env);

  return {
    logger,
    listProviders: new ListProvidersUseCase(persistence.providers, persistence.offers),
    checkAvailability: new CheckAvailabilityUseCase(persistence.providers, persistence.offers, externals, logger),
    confirmReservation: new ConfirmReservationUseCase(persistence.providers, persistence.offers, externals, logger),
    verifyProvider: new VerifyProviderUseCase(persistence.providers, logger),
    persistence: { kind: persistence.kind },
    shutdown: () => persistence.shutdown(),
  };
}

function buildExternals(env: Record<string, string | undefined>): ProveedorExternoResolver {
  try {
    return createExternalProviderRegistry(env);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`${reason}. Set EXTERNAL_PROVIDERS_MODE=mock to use the local simulator (no API keys needed).`);
  }
}
