import { BookingRepository } from '../../domain/repositories/booking.repository';
import { BookingOutput, toBookingOutput } from '../dtos/booking.dto';
import { BookingNotFoundError } from '../errors/application.error';

export class GetBookingUseCase {
  constructor(private readonly bookings: BookingRepository) {}

  // requesterId: usuario autenticado que pide la reserva (multiusuario).
  // Si la reserva es de otro usuario se responde como si no existiera (404),
  // para no revelar reservas ajenas. Sin requesterId es una llamada interna.
  async execute(bookingId: string, requesterId?: string): Promise<BookingOutput> {
    const booking = await this.bookings.findById(bookingId);
    if (!booking) throw new BookingNotFoundError(bookingId);
    if (requesterId && booking.userId !== requesterId) throw new BookingNotFoundError(bookingId);
    return toBookingOutput(booking);
  }
}
