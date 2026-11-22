import { InvalidUserError } from '../errors/domain.error';

export enum UserRole {
  TRAVELER = 'TRAVELER',
  ADMIN = 'ADMIN',
}

export interface UserProps {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
}

// Validación simple de formato; la validación fuerte de entrada la hace el adaptador HTTP.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Entidad de dominio pura: no sabe de bcrypt, JWT, Prisma ni HTTP.
// Guarda la contraseña SOLO como hash; la contraseña en texto plano nunca llega aquí.
export class User {
  private constructor(private readonly props: UserProps) {}

  // Crear un usuario nuevo (registro).
  static register(input: {
    id: string;
    email: string;
    name: string;
    passwordHash: string;
    role?: UserRole;
    now?: Date;
  }): User {
    const email = User.normalizeEmail(input.email);
    if (!EMAIL_PATTERN.test(email)) throw new InvalidUserError('El correo electrónico no es válido');

    const name = input.name.trim();
    if (name.length < 2) throw new InvalidUserError('El nombre debe tener al menos 2 caracteres');

    if (!input.passwordHash) throw new InvalidUserError('El usuario necesita una contraseña');

    return new User({
      id: input.id,
      email,
      name,
      passwordHash: input.passwordHash,
      role: input.role ?? UserRole.TRAVELER,
      createdAt: input.now ?? new Date(),
    });
  }

  // Reconstruir un usuario ya guardado (persistencia). No revalida: ya fue válido al crearse.
  static restore(props: UserProps): User {
    return new User({ ...props });
  }

  // Los correos se comparan sin importar mayúsculas ni espacios.
  static normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  get id(): string { return this.props.id; }
  get email(): string { return this.props.email; }
  get name(): string { return this.props.name; }
  get passwordHash(): string { return this.props.passwordHash; }
  get role(): UserRole { return this.props.role; }
  get createdAt(): Date { return this.props.createdAt; }

  isAdmin(): boolean {
    return this.props.role === UserRole.ADMIN;
  }
}
