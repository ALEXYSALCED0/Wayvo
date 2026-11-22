export abstract class ApplicationError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class EmailAlreadyRegisteredError extends ApplicationError {
  readonly code = 'EMAIL_ALREADY_REGISTERED';

  constructor() {
    super('Ya existe una cuenta con ese correo electrónico');
  }
}

// Mismo mensaje si el correo no existe o si la contraseña es incorrecta:
// así no se revela qué correos están registrados.
export class InvalidCredentialsError extends ApplicationError {
  readonly code = 'INVALID_CREDENTIALS';

  constructor() {
    super('Correo o contraseña incorrectos');
  }
}

export class InvalidTokenError extends ApplicationError {
  readonly code = 'INVALID_TOKEN';

  constructor() {
    super('La sesión no es válida o expiró. Inicia sesión de nuevo');
  }
}

export class UserNotFoundError extends ApplicationError {
  readonly code = 'USER_NOT_FOUND';

  constructor() {
    super('El usuario no existe');
  }
}
