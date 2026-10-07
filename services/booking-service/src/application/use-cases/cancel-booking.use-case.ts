import { BookingRepository } from '../../domain/repositories/booking.repository';
import { BookingOutput, CancelBookingInput, toBookingOutput } from '../dtos/booking.dto';
import { BookingNotFoundError } from '../errors/application.error';
import { LoggerPort } from '../ports/logger.port';

// Transacción de compensación de la Saga: libera la reserva cuando un paso
// posterior falla (por ejemplo, el proveedor no tiene disponibilidad).
// También sirve para que el usuario cancele. Es idempotente.
export class CancelBookingUseCase {
  constructor(
    private readonly bookings: BookingRepository,
    private readonly logger: LoggerPort,
  ) {}

  async execute(input: CancelBookingInput): Promise<BookingOutput> {
    const booking = await this.bookings.findById(input.bookingId);
    if (!booking) throw new BookingNotFoundError(input.bookingId);

    if (booking.isCancelled()) {
      this.logger.info('Booking already cancelled, nothing to do', { bookingId: booking.id });
      return toBookingOutput(booking);
    }

    booking.cancel(input.reason);
    await this.bookings.save(booking);
    this.logger.info('Booking cancelled', { bookingId: booking.id, reason: input.reason });

    return toBookingOutput(booking);
  }
}