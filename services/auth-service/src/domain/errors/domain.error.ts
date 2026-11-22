// Error base del dominio. Las capas externas lo traducen (por ejemplo a HTTP 422)
// sin que el dominio sepa nada de HTTP.
export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidUserError extends DomainError {
  readonly code = 'INVALID_USER';
}
