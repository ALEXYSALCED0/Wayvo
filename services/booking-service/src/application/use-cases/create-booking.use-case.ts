import { Booking } from '../../domain/entities/booking';
import { BookingItem } from '../../domain/entities/booking-item';
import { BookingRepository } from '../../domain/repositories/booking.repository';
import { BookingOutput, CreateBookingInput, toBookingOutput } from '../dtos/booking.dto';
import { IdGenerator } from '../ports/id-generator.port';
import { LoggerPort } from '../ports/logger.port';

// Registra una solicitud de reserva asociada a un viaje. Siempre nace PENDING:
// solo la Saga, cuando el proveedor confirme, la pasará a CONFIRMED.
export class CreateBookingUseCase {
  constructor(
    private readonly bookings: BookingRepository,
    private readonly ids: IdGenerator,
    private readonly logger: LoggerPort,
  ) {}

  async execute(input: CreateBookingInput): Promise<BookingOutput> {
    const items = input.items.map((item) =>
      BookingItem.create({ id: this.ids.generate(), ...item }),
    );

    const booking = Booking.create({
      id: this.ids.generate(),
      tripId: input.tripId,
      userId: input.userId,
      currency: input.currency,
      items,
    });

    await this.bookings.save(booking);
    this.logger.info('Booking created', { bookingId: booking.id, tripId: booking.tripId, status: booking.status });

    return toBookingOutput(booking);
  }
}