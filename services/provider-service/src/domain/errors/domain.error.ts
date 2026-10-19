// Error base del dominio. Las capas externas lo traducen (por ejemplo a HTTP 400/409)
// sin que el dominio sepa nada de HTTP.
export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidProviderError extends DomainError {
  readonly code = 'INVALID_PROVIDER';
}

export class InvalidVerificationTransitionError extends DomainError {
  readonly code = 'INVALID_VERIFICATION_TRANSITION';
}

export class InvalidServiceOfferError extends DomainError {
  readonly code = 'INVALID_SERVICE_OFFER';
}

export class InsufficientCapacityError extends DomainError {
  readonly code = 'INSUFFICIENT_CAPACITY';
}
