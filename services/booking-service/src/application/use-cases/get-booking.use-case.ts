import { BookingRepository } from '../../domain/repositories/booking.repository';
import { BookingOutput, toBookingOutput } from '../dtos/booking.dto';
import { BookingNotFoundError } from '../errors/application.error';

export class GetBookingUseCase {
  constructor(private readonly bookings: BookingRepository) {}

  async execute(bookingId: string): Promise<BookingOutput> {
    const booking = await this.bookings.findById(bookingId);
    if (!booking) throw new BookingNotFoundError(bookingId);
    return toBookingOutput(booking);
  }
}