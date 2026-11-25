import { InvalidSubscriptionError } from '../errors/domain.error';

// Estados propios de Wayvo. Cada pasarela (Stripe, etc.) tiene los suyos; el Adapter
// los traduce a estos para que el dominio no dependa de ninguna.
export enum SubscriptionStatus {
  INCOMPLETE = 'INCOMPLETE', // creada, falta confirmar el primer pago
  ACTIVE = 'ACTIVE', // pagada y vigente
  PAST_DUE = 'PAST_DUE', // un cobro falló
  CANCELED = 'CANCELED',
}

export enum PlanCode {
  PREMIUM = 'PREMIUM',
}

export interface SubscriptionProps {
  id: string;
  userId: string;
  email: string;
  plan: PlanCode;
  status: SubscriptionStatus;
  providerCustomerRef: string;
  providerSubscriptionRef: string;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
  canceledAt: Date | null;
}

// Lo que la pasarela informa de una suscripción, ya en términos de Wayvo.
export interface ProviderSubscriptionState {
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

export interface NewSubscriptionInput {
  id: string;
  userId: string;
  email: string;
  providerCustomerRef: string;
  providerSubscriptionRef: string;
  state: ProviderSubscriptionState;
  now?: Date;
}

export class Subscription {
  private constructor(private readonly props: SubscriptionProps) {}

  static create(input: NewSubscriptionInput): Subscription {
    if (!input.userId.trim()) throw new InvalidSubscriptionError('userId is required');
    if (!input.providerSubscriptionRef.trim()) {
      throw new InvalidSubscriptionError('providerSubscriptionRef is required');
    }
    const now = input.now ?? new Date();
    return new Subscription({
      id: input.id,
      userId: input.userId,
      email: input.email,
      plan: PlanCode.PREMIUM,
      status: input.state.status,
      providerCustomerRef: input.providerCustomerRef,
      providerSubscriptionRef: input.providerSubscriptionRef,
      currentPeriodEnd: input.state.currentPeriodEnd,
      cancelAtPeriodEnd: input.state.cancelAtPeriodEnd,
      createdAt: now,
      updatedAt: now,
      canceledAt: input.state.status === SubscriptionStatus.CANCELED ? now : null,
    });
  }

  static restore(props: SubscriptionProps): Subscription {
    return new Subscription({ ...props });
  }

  get id(): string { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get email(): string { return this.props.email; }
  get plan(): PlanCode { return this.props.plan; }
  get status(): SubscriptionStatus { return this.props.status; }
  get providerCustomerRef(): string { return this.props.providerCustomerRef; }
  get providerSubscriptionRef(): string { return this.props.providerSubscriptionRef; }
  get currentPeriodEnd(): Date | null { return this.props.currentPeriodEnd; }
  get cancelAtPeriodEnd(): boolean { return this.props.cancelAtPeriodEnd; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  get canceledAt(): Date | null { return this.props.canceledAt; }

  // PREMIUM mientras esté pagada. Si un cobro falla (PAST_DUE) se pierde el acceso.
  get isActive(): boolean {
    return this.props.status === SubscriptionStatus.ACTIVE;
  }

  // Una suscripción que no se terminó de pagar y puede reemplazarse por una nueva.
  get isPending(): boolean {
    return (
      this.props.status === SubscriptionStatus.INCOMPLETE ||
      this.props.status === SubscriptionStatus.PAST_DUE
    );
  }

  // Aplica lo que dice la pasarela (consulta directa o webhook). Una suscripción
  // cancelada no vuelve a abrirse: un evento atrasado no debe reactivarla.
  syncWith(state: ProviderSubscriptionState, now: Date = new Date()): void {
    if (this.props.status === SubscriptionStatus.CANCELED) return;
    this.props.status = state.status;
    this.props.currentPeriodEnd = state.currentPeriodEnd;
    this.props.cancelAtPeriodEnd = state.cancelAtPeriodEnd;
    if (state.status === SubscriptionStatus.CANCELED) this.props.canceledAt = now;
    this.props.updatedAt = now;
  }

  markCanceled(now: Date = new Date()): void {
    if (this.props.status === SubscriptionStatus.CANCELED) return;
    this.props.status = SubscriptionStatus.CANCELED;
    this.props.canceledAt = now;
    this.props.cancelAtPeriodEnd = false;
    this.props.updatedAt = now;
  }
}
