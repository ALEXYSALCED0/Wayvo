import { ProviderRepository } from '../../domain/repositories/provider.repository';
import { ServiceOfferRepository } from '../../domain/repositories/service-offer.repository';
import {
  CheckAvailabilityInput,
  CheckAvailabilityItemInput,
  CheckAvailabilityOutput,
  ItemAvailabilityDetail,
} from '../dtos/availability.dto';
import { InvalidAvailabilityRequestError } from '../errors/application.error';
import { LoggerPort } from '../ports/logger.port';
import { ProveedorExternoResolver } from '../ports/proveedor-externo-resolver.port';

// valida primero que la oferta existe, es de ese proveedor y está VERIFIED, oferta activa y tiene cupo,
// solo así pregunta al proveedor externo por IProveedorExterno

export class CheckAvailabilityUseCase {
  constructor(
    private readonly providers: ProviderRepository,
    private readonly offers: ServiceOfferRepository,
    private readonly externals: ProveedorExternoResolver,
    private readonly logger: LoggerPort,
  ) {}

  async execute(input: CheckAvailabilityInput): Promise<CheckAvailabilityOutput> {
    this.validate(input);

    const details: ItemAvailabilityDetail[] = [];
    for (const item of input.items) {
      details.push(await this.checkItem(item, input.correlationId));
    }

    const failed = details.filter((d) => !d.available);
    const output: CheckAvailabilityOutput = {
      available: failed.length === 0,
      details,
    };
    if (failed.length > 0) {
      output.reason = failed.map((d) => `${d.offerId}: ${d.reason}`).join('; ');
    }

    this.logger.info('Availability checked', {
      correlationId: input.correlationId,
      available: output.available,
      items: input.items.length,
      reason: output.reason,
    });
    return output;
  }

  private async checkItem(
    item: CheckAvailabilityItemInput,
    correlationId?: string,
  ): Promise<ItemAvailabilityDetail> {
    const base = { offerId: item.offerId, providerId: item.providerId };
    const unavailable = (reason: string, remainingCapacity?: number): ItemAvailabilityDetail => ({
      ...base,
      available: false,
      reason,
      ...(remainingCapacity !== undefined && { remainingCapacity }),
    });

    const offer = await this.offers.findById(item.offerId);
    if (!offer) return unavailable('Offer not found');
    if (offer.providerId !== item.providerId) {
      return unavailable('Offer does not belong to the given provider');
    }
    if (offer.type !== item.type) {
      return unavailable(`Offer is of type ${offer.type}, not ${item.type}`);
    }

    const provider = await this.providers.findById(item.providerId);
    if (!provider) return unavailable('Provider not found');
    if (!provider.canReceiveBookings()) {
      return unavailable(`Provider is not verified (status ${provider.verificationStatus})`);
    }

    if (!offer.active) return unavailable('Offer is not active');
    if (!offer.hasAvailability(item.quantity)) {
      return unavailable(
        `Not enough capacity: requested ${item.quantity}, available ${offer.availableCapacity}`,
        offer.availableCapacity,
      );
    }

    // Catálogo propio verificado, sí se consulta al proveedor externo por Adapter
    let external;
    try {
      external = await this.externals
        .resolve(offer.type)
        .consultarDisponibilidad({
          offerId: offer.id,
          quantity: item.quantity,
          metadata: { ...offer.metadata },
        });
    } catch (error) {
      this.logger.error('External provider failed while checking availability', {
        correlationId,
        offerId: offer.id,
        providerId: provider.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }

    const remaining = [offer.availableCapacity, external.remainingUnits].filter(
      (n): n is number => typeof n === 'number',
    );
    const remainingCapacity = Math.min(...remaining);

    if (!external.available) {
      return unavailable(external.reason ?? 'External provider reported no availability', remainingCapacity);
    }
    return { ...base, available: true, remainingCapacity };
  }

  private validate(input: CheckAvailabilityInput): void {
    if (!input.items || input.items.length === 0) {
      throw new InvalidAvailabilityRequestError('At least one item is required');
    }
    for (const item of input.items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new InvalidAvailabilityRequestError(
          `Quantity for offer ${item.offerId} must be a positive integer`,
        );
      }
    }
  }
}
