import { ServiceOfferRepository } from '../../domain/repositories/service-offer.repository';
import { ReleaseReservationInput, ReleaseReservationOutput, ReleasedItem } from '../dtos/release.dto';
import { InvalidReservationRequestError } from '../errors/application.error';
import { LoggerPort } from '../ports/logger.port';

// Compensación de la Saga: devuelve el cupo que apartó /confirm.
// Se usa cuando algo falla DESPUÉS de reservar (pago rechazado, fallo al confirmar
// el viaje, etc.). La devolución es atómica (releaseCapacity) y tolerante: si una
// oferta no existe o falla, se informa en el resultado y se sigue con las demás,
// porque en una compensación hay que liberar todo lo posible.
//
// Limitación: no es idempotente. Llamarlo dos veces con el mismo bookingId devuelve
// el cupo dos veces; la Saga lo invoca una sola vez por reserva.
export class ReleaseReservationUseCase {
  constructor(
    private readonly offers: ServiceOfferRepository,
    private readonly logger: LoggerPort,
  ) {}

  async execute(input: ReleaseReservationInput): Promise<ReleaseReservationOutput> {
    this.validate(input);
    const { bookingId, correlationId } = input;

    const items: ReleasedItem[] = [];
    for (const item of input.items) {
      items.push(await this.releaseItem(bookingId, item.offerId, item.quantity, correlationId));
    }

    const failed = items.filter((i) => !i.released).length;
    const log = { correlationId, bookingId, items: items.length, failed };
    if (failed > 0) this.logger.warn('Reservation released with errors', log);
    else this.logger.info('Reservation released', log);

    return { bookingId, releasedAt: new Date().toISOString(), items };
  }

  private async releaseItem(
    bookingId: string,
    offerId: string,
    quantity: number,
    correlationId?: string,
  ): Promise<ReleasedItem> {
    try {
      const offer = await this.offers.findById(offerId);
      if (!offer) return { offerId, quantity, released: false, reason: 'Offer not found' };
      await this.offers.releaseCapacity(offerId, quantity);
      return { offerId, quantity, released: true };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error('Could not release capacity', { correlationId, bookingId, offerId, quantity, error: reason });
      return { offerId, quantity, released: false, reason };
    }
  }

  private validate(input: ReleaseReservationInput): void {
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
