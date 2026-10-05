// Error base del dominio. Las capas externas lo traducen (por ejemplo a HTTP 400/409)
// sin que el dominio sepa nada de HTTP.
export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidBookingError extends DomainError {
  readonly code = 'INVALID_BOOKING';
}

export class InvalidBookingStatusTransitionError extends DomainError {
  readonly code = 'INVALID_BOOKING_STATUS_TRANSITION';
}