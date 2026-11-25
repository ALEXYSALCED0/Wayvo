export abstract class ApplicationError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

// También se usa cuando la suscripción existe pero es de otro usuario: no se revela.
export class SubscriptionNotFoundError extends ApplicationError {
  readonly code = 'SUBSCRIPTION_NOT_FOUND';

  constructor() {
    super('La suscripción no existe');
  }
}

export class AlreadySubscribedError extends ApplicationError {
  readonly code = 'ALREADY_SUBSCRIBED';

  constructor() {
    super('La cuenta ya tiene una suscripción PREMIUM activa');
  }
}

export class UnauthenticatedError extends ApplicationError {
  readonly code = 'UNAUTHENTICATED';

  constructor() {
    super('Falta la identidad del usuario');
  }
}
