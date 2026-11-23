import { InvalidUserError } from '../errors/domain.error';

export enum UserRole {
  TRAVELER = 'TRAVELER',
  ADMIN = 'ADMIN',
}

// Plan de la cuenta. Lo cambia payment-service (a través de una ruta interna) según el
// estado de la suscripción: nadie lo puede cambiar desde el navegador.
export enum AccountPlan {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
}

export interface UserProps {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  plan: AccountPlan;
  // Suscripción que respalda el plan PREMIUM (null en FREE).
  planSubscriptionId: string | null;
  // Fin del periodo pagado (informativo).
  planExpiresAt: Date | null;
}

// Al reconstruir un usuario guardado, los campos de plan son opcionales (cuentas anteriores = FREE).
export type RestoreUserProps = Omit<UserProps, 'plan' | 'planSubscriptionId' | 'planExpiresAt'> &
  Partial<Pick<UserProps, 'plan' | 'planSubscriptionId' | 'planExpiresAt'>>;

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
      plan: AccountPlan.FREE,
      planSubscriptionId: null,
      planExpiresAt: null,
    });
  }

  // Reconstruir un usuario ya guardado (persistencia). No revalida: ya fue válido al crearse.
  static restore(props: RestoreUserProps): User {
    return new User({
      ...props,
      plan: props.plan ?? AccountPlan.FREE,
      planSubscriptionId: props.planSubscriptionId ?? null,
      planExpiresAt: props.planExpiresAt ?? null,
    });
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
  get plan(): AccountPlan { return this.props.plan; }
  get planSubscriptionId(): string | null { return this.props.planSubscriptionId; }
  get planExpiresAt(): Date | null { return this.props.planExpiresAt; }

  isPremium(): boolean {
    return this.props.plan === AccountPlan.PREMIUM;
  }

  // Cambia el plan. Idempotente: pedir dos veces lo mismo deja el mismo resultado.
  // PREMIUM exige la suscripción que lo respalda; FREE la borra.
  changePlan(plan: AccountPlan, subscriptionId: string | null, expiresAt: Date | null): void {
    if (plan === AccountPlan.PREMIUM) {
      if (!subscriptionId) throw new InvalidUserError('El plan PREMIUM necesita la suscripción que lo respalda');
      this.props.plan = AccountPlan.PREMIUM;
      this.props.planSubscriptionId = subscriptionId;
      this.props.planExpiresAt = expiresAt;
      return;
    }
    this.props.plan = AccountPlan.FREE;
    this.props.planSubscriptionId = null;
    this.props.planExpiresAt = null;
  }

  isAdmin(): boolean {
    return this.props.role === UserRole.ADMIN;
  }
}
