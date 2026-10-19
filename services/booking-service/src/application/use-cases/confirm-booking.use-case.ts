import { BookingRepository } from '../../domain/repositories/booking.repository';
import { BookingOutput, toBookingOutput } from '../dtos/booking.dto';
import { BookingNotFoundError } from '../errors/application.error';
import { LoggerPort } from '../ports/logger.port';

// Último paso del flujo feliz de la Saga: PENDING -> CONFIRMED.
// Si la reserva no está PENDING, el dominio lanza InvalidBookingStatusTransitionError.
export class ConfirmBookingUseCase {
  constructor(
    private readonly bookings: BookingRepository,
    private readonly logger: LoggerPort,
  ) {}

  async execute(bookingId: string): Promise<BookingOutput> {
    const booking = await this.bookings.findById(bookingId);
    if (!booking) throw new BookingNotFoundError(bookingId);

    booking.confirm();
    await this.bookings.save(booking);
    this.logger.info('Booking confirmed', { bookingId: booking.id });

    return toBookingOutput(booking);
  }
}