export abstract class ApplicationError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ProviderNotFoundError extends ApplicationError {
  readonly code = 'PROVIDER_NOT_FOUND';

  constructor(providerId: string) {
    super(`Provider ${providerId} not found`);
  }
}

export class InvalidAvailabilityRequestError extends ApplicationError {
  readonly code = 'INVALID_AVAILABILITY_REQUEST';
}


export class InvalidReservationRequestError extends ApplicationError {
  readonly code = 'INVALID_RESERVATION_REQUEST';
}

// si no se pudo confirmar un item
export class ReservationRejectedError extends ApplicationError {
  readonly code = 'RESERVATION_REJECTED';

  constructor(
    readonly offerId: string,
    readonly reason: string,
  ) {
    super(`Reservation for offer ${offerId} rejected: ${reason}`);
  }
}
