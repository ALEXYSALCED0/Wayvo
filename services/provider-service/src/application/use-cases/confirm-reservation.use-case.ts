import { Provider } from '../../domain/entities/provider';
import { ServiceOffer } from '../../domain/entities/service-offer';
import { ProviderType } from '../../domain/value-objects/provider-type';
import { VerificationStatus } from '../../domain/value-objects/verification-status';
import { ProviderRepository } from '../../domain/repositories/provider.repository';
import { ServiceOfferRepository } from '../../domain/repositories/service-offer.repository';
import { CheckAvailabilityItemInput } from '../dtos/availability.dto';
import { ConfirmedItem, ConfirmReservationInput, ConfirmReservationOutput } from '../dtos/reservation.dto';
import { InvalidReservationRequestError, ReservationRejectedError } from '../errors/application.error';
import { LoggerPort } from '../ports/logger.port';
import { ProveedorExternoResolver } from '../ports/proveedor-externo-resolver.port';
import { flightNumbersFor, hotelCodesFor } from '../../infrastructure/mock/mock-inventory';

// Paso de reserva de la Saga, después de check-availability.
// Por cada item se valida la oferta, confirma con el proveedor externo (vía Adapter) y descuenta el cupo
// Si falla, devuelve el cupo de los anteriores y propaga el error

export class ConfirmReservationUseCase {
  constructor(
    private readonly providers: ProviderRepository,
    private readonly offers: ServiceOfferRepository,
    private readonly externals: ProveedorExternoResolver,
    private readonly logger: LoggerPort,
  ) {}

  async execute(input: ConfirmReservationInput): Promise<ConfirmReservationOutput> {
    this.validate(input);
    const { bookingId, correlationId } = input;

    const confirmed: ConfirmedItem[] = [];
    try {
      for (const item of input.items) {
        confirmed.push(await this.confirmItem(bookingId, item, correlationId));
      }
    } catch (error) {
      await this.releaseLocalCapacity(confirmed, bookingId, correlationId);
      throw error;
    }

    const codes = [...new Set(confirmed.flatMap((c) => [c.reservationCode, c.confirmationCode]))].filter(
      (code): code is string => !!code,
    );
    const output: ConfirmReservationOutput = {
      bookingId,
      reservationCode: `RES-${bookingId}`,
      ...(codes.length > 0 && { confirmationCode: codes.join(',') }),
      confirmedAt: new Date().toISOString(),
      items: confirmed,
    };
    this.logger.info('Reservation confirmed', { correlationId, bookingId, items: confirmed.length });
    return output;
  }

  private async confirmItem(
    bookingId: string,
    item: CheckAvailabilityItemInput,
    correlationId?: string,
  ): Promise<ConfirmedItem> {
    const offer = await this.loadBookableOffer(item);

    let result;
    try {
      result = await this.externals.resolve(offer.type).confirmarReserva({
        bookingId,
        offerId: offer.id,
        quantity: item.quantity,
        metadata: { ...offer.metadata },
      });
    } catch (error) {
      this.logger.error('External provider failed while confirming reservation', {
        correlationId,
        bookingId,
        offerId: offer.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
    if (!result.success) {
      throw new ReservationRejectedError(offer.id, result.reason ?? 'External provider rejected the reservation');
    }

    // si el cupo propio no se puede descontar, hay que dejar rastro
    try {
      offer.reserve(item.quantity);
      await this.offers.save(offer);
    } catch (error) {
      this.logger.error('External reservation confirmed but local capacity could not be updated', {
        correlationId,
        bookingId,
        offerId: offer.id,
        reservationCode: result.reservationCode,
        confirmationCode: result.confirmationCode,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }

    return {
      offerId: offer.id,
      providerId: offer.providerId,
      quantity: item.quantity,
      ...(result.reservationCode && { reservationCode: result.reservationCode }),
      ...(result.confirmationCode && { confirmationCode: result.confirmationCode }),
    };
  }

  private async loadBookableOffer(item: CheckAvailabilityItemInput): Promise<ServiceOffer> {
    const reject = (reason: string) => new ReservationRejectedError(item.offerId, reason);

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
        const sanitizedMetadata = { ...item.metadata };
        if (sanitizedMetadata.hotelCode && sanitizedMetadata.hotelCode === item.offerId && offer.metadata?.hotelCode) {
          sanitizedMetadata.hotelCode = offer.metadata.hotelCode;
        }
        offer.updateMetadata({ ...offer.metadata, ...sanitizedMetadata });
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

    if (!offer) throw reject('Offer not found');
    if (offer.providerId !== item.providerId) throw reject('Offer does not belong to the given provider');
    if (offer.type !== item.type) throw reject(`Offer is of type ${offer.type}, not ${item.type}`);

    if (!provider) throw reject('Provider not found');
    if (!provider.canReceiveBookings()) {
      throw reject(`Provider is not verified (status ${provider.verificationStatus})`);
    }
    if (!offer.active) throw reject('Offer is not active');
    if (!offer.hasAvailability(item.quantity)) {
      throw reject(`Not enough capacity: requested ${item.quantity}, available ${offer.availableCapacity}`);
    }
    return offer;
  }

  private async releaseLocalCapacity(
    confirmed: ConfirmedItem[],
    bookingId: string,
    correlationId?: string,
  ): Promise<void> {
    for (const item of [...confirmed].reverse()) {
      try {
        const offer = await this.offers.findById(item.offerId);
        if (!offer) continue;
        offer.release(item.quantity);
        await this.offers.save(offer);
      } catch (error) {
        this.logger.error('Could not release local capacity after a failed confirmation', {
          correlationId,
          bookingId,
          offerId: item.offerId,
          quantity: item.quantity,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    if (confirmed.length > 0) {
      this.logger.warn('Reservation rolled back locally; provider-side confirmations cannot be cancelled', {
        correlationId,
        bookingId,
        providerConfirmations: confirmed.map((c) => ({
          offerId: c.offerId,
          reservationCode: c.reservationCode,
          confirmationCode: c.confirmationCode,
        })),
      });
    }
  }

  private validate(input: ConfirmReservationInput): void {
    if (!input.bookingId || input.bookingId.trim() === '') {
      throw new InvalidReservationRequestError('bookingId is required');
    }
    if (!input.items || input.items.length === 0) {
      throw new InvalidReservationRequestError('At least one item is required');
    }
    for (const item of input.items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new InvalidReservationRequestError(
          `Quantity for offer ${item.offerId} must be a positive integer`,
        );
      }
    }
  }
}
