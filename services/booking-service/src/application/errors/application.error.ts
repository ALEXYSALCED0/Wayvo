export abstract class ApplicationError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class BookingNotFoundError extends ApplicationError {
  readonly code = 'BOOKING_NOT_FOUND';

  constructor(bookingId: string) {
    super(`Booking ${bookingId} not found`);
  }
}