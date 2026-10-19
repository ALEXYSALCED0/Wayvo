import { LoggerPort } from '../../../src/application/ports/logger.port';
import {
  ConfirmacionResultado,
  DisponibilidadQuery,
  DisponibilidadResultado,
  IProveedorExterno,
  ReservaDatos,
} from '../../../src/application/ports/proveedor-externo.port';
import { ProveedorExternoResolver } from '../../../src/application/ports/proveedor-externo-resolver.port';
import { Provider } from '../../../src/domain/entities/provider';
import { ServiceOffer } from '../../../src/domain/entities/service-offer';
import { ServiceOfferType } from '../../../src/domain/value-objects/service-offer-type';
import { InMemoryProviderRepository } from '../../../src/infrastructure/persistence/in-memory-provider.repository';
import { InMemoryServiceOfferRepository } from '../../../src/infrastructure/persistence/in-memory-service-offer.repository';
import { makeOffer, makeProvider } from '../domain/fixtures';

export const silentLogger: LoggerPort = { info: () => {}, warn: () => {}, error: () => {} };

// Logger que recuerda lo que se le pidió loguear, para poder hacer asserts
export function recordingLogger() {
  const errors: Array<{ message: string; meta?: Record<string, unknown> }> = [];
  const logger: LoggerPort = {
    info: () => {},
    warn: () => {},
    error: (message, meta) => errors.push({ message, meta }),
  };
  return { logger, errors };
}

// Proveedor externo configurable por test
export class FakeProveedorExterno implements IProveedorExterno {
  calls: DisponibilidadQuery[] = [];
  response: DisponibilidadResultado = { available: true, remainingUnits: 50 };
  failWith: Error | null = null;

  async consultarDisponibilidad(criterios: DisponibilidadQuery): Promise<DisponibilidadResultado> {
    this.calls.push(criterios);
    if (this.failWith) throw this.failWith;
    return this.response;
  }

  async confirmarReserva(datos: ReservaDatos): Promise<ConfirmacionResultado> {
    return { success: true, reservationCode: `RES-${datos.bookingId}` };
  }
}

export class FakeResolver implements ProveedorExternoResolver {
  constructor(private readonly byType: Partial<Record<ServiceOfferType, IProveedorExterno>>) {}

  resolve(type: ServiceOfferType): IProveedorExterno {
    const adapter = this.byType[type];
    if (!adapter) throw new Error(`No adapter registered for ${type}`);
    return adapter;
  }
}

// Catálogo ya cargado
export async function seedCatalog(opts: { verified?: boolean } = {}) {
  const providers = new InMemoryProviderRepository();
  const offers = new InMemoryServiceOfferRepository();
  const provider: Provider = makeProvider();
  if (opts.verified !== false) provider.verify();
  const offer: ServiceOffer = makeOffer();
  await providers.save(provider);
  await offers.save(offer);
  return { providers, offers, provider, offer };
}
