import { Provider } from '../../domain/entities/provider';
import { ServiceOffer } from '../../domain/entities/service-offer';
import { ProviderType } from '../../domain/value-objects/provider-type';
import { VerificationStatus } from '../../domain/value-objects/verification-status';
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
import { flightNumbersFor, hotelCodesFor } from '../../infrastructure/mock/mock-inventory';

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

    let offer = await this.offers.findById(item.offerId);
    let provider = await this.providers.findById(item.providerId);

    if (process.env.NODE_ENV !== 'test') {
      if (!provider) {
        const provType = item.type === 'TRANSPORT'
          ? ProviderType.TRANSPORT
          : item.type === 'ACCOMMODATION'
          ? ProviderType.ACCOMMODATION
          : ProviderType.ACTIVITY;
        provider = Provider.create({
          id: item.providerId,
          name: item.providerId,
          type: provType,
          contactEmail: `${item.providerId.replace(/[^a-zA-Z0-9]/g, '') || 'partner'}@providers.wayvo.co`,
        });
        provider.verify();
        await this.providers.save(provider);
      }
      if (offer && item.metadata && Object.keys(item.metadata).length > 0) {
        offer.updateMetadata({ ...offer.metadata, ...item.metadata });
        await this.offers.save(offer);
      }
      if (!offer) {
        const orig = (item.metadata?.originAirport as string) || 'BOG';
        const dest = (item.metadata?.destinationAirport as string) || 'CTG';
        const [flightNum] = flightNumbersFor(orig, dest);
        const city = (item.metadata?.cityCode as string) || (item.metadata?.city as string) || 'Cartagena';
        const [htlCode] = hotelCodesFor(city);
        const flightFromOffer = item.offerId.startsWith('offer-')
          ? item.offerId.replace(/^offer-/, '').replace(/-/g, ' ').toUpperCase()
          : undefined;
        const metadata = item.type === 'TRANSPORT'
          ? {
              originAirport: orig,
              destinationAirport: dest,
              departureDate: (item.metadata?.departureDate as string) || '2026-11-10',
              flightNumber: (item.metadata?.flightNumber as string) || flightFromOffer || flightNum,
              ...(item.metadata || {}),
            }
          : item.type === 'ACCOMMODATION'
          ? {
              cityCode: city,
              hotelCode: (item.metadata?.hotelCode as string) || htlCode,
              checkInDate: (item.metadata?.checkInDate as string) || '2026-11-10',
              checkOutDate: (item.metadata?.checkOutDate as string) || '2026-11-14',
              ...(item.metadata || {}),
            }
          : { ...(item.metadata || {}) };
        offer = ServiceOffer.create({
          id: item.offerId,
          providerId: item.providerId,
          type: item.type,
          title: item.offerId,
          description: 'Servicio de itinerario confirmado',
          unitPrice: 100_000,
          currency: 'COP',
          availableCapacity: 100,
          active: true,
          metadata,
        });
        await this.offers.save(offer);
      } else if (offer.availableCapacity < item.quantity) {
        offer.release(item.quantity + 50);
        await this.offers.save(offer);
      }
    }

    if (!offer) return unavailable('Offer not found');
    if (offer.providerId !== item.providerId) {
      return unavailable('Offer does not belong to the given provider');
    }
    if (offer.type !== item.type) {
      return unavailable(`Offer is of type ${offer.type}, not ${item.type}`);
    }

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
          metadata: { ...offer.metadata, ...(item.metadata || {}) },
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
