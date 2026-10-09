import { InvalidProviderError, InvalidVerificationTransitionError } from '../errors/domain.error';
import { ProviderType } from '../value-objects/provider-type';
import { VerificationStatus } from '../value-objects/verification-status';

export interface ProviderProps {
  id: string;
  name: string;
  type: ProviderType;
  verificationStatus: VerificationStatus;
  verificationNote: string | null;
  contactEmail: string;
  contactPhone: string | null;
  rating: number | null;
  websiteUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProviderProps {
  id: string;
  name: string;
  type: ProviderType;
  contactEmail: string;
  contactPhone?: string;
  rating?: number;
  websiteUrl?: string;
  now?: Date;
}

export type ProviderPrimitives = ProviderProps;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Aggregate root del catálogo. Todo proveedor nace PENDING y solo puede cambiar de
// estado con verify()/reject(), no desde afuera
export class Provider {
  private constructor(private props: ProviderProps) {}

  static create(input: CreateProviderProps): Provider {
    if (!input.id) throw new InvalidProviderError('A provider needs an id');
    if (!input.name || input.name.trim() === '') {
      throw new InvalidProviderError('A provider needs a name');
    }
    if (!EMAIL_PATTERN.test(input.contactEmail ?? '')) {
      throw new InvalidProviderError('A provider needs a valid contactEmail');
    }
    if (input.rating !== undefined && (input.rating < 0 || input.rating > 5)) {
      throw new InvalidProviderError('Provider rating must be between 0 and 5');
    }
    const now = input.now ?? new Date();
    return new Provider({
      id: input.id,
      name: input.name.trim(),
      type: input.type,
      verificationStatus: VerificationStatus.PENDING,
      verificationNote: null,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone ?? null,
      rating: input.rating ?? null,
      websiteUrl: input.websiteUrl ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Reconstruye un proveedor ya existente (ej: desde la base de datos)
  // sin volver a aplicar las validaciones de creación
  static restore(props: ProviderProps): Provider {
    return new Provider({ ...props });
  }

  get id(): string { return this.props.id; }
  get name(): string { return this.props.name; }
  get type(): ProviderType { return this.props.type; }
  get verificationStatus(): VerificationStatus { return this.props.verificationStatus; }
  get verificationNote(): string | null { return this.props.verificationNote; }
  get contactEmail(): string { return this.props.contactEmail; }
  get contactPhone(): string | null { return this.props.contactPhone; }
  get rating(): number | null { return this.props.rating; }
  get websiteUrl(): string | null { return this.props.websiteUrl; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  isVerified(): boolean { return this.props.verificationStatus === VerificationStatus.VERIFIED; }
  isPending(): boolean { return this.props.verificationStatus === VerificationStatus.PENDING; }
  isRejected(): boolean { return this.props.verificationStatus === VerificationStatus.REJECTED; }

  // Solo los proveedores verificados pueden recibir reservas.
  canReceiveBookings(): boolean { return this.isVerified(); }

  verify(now: Date = new Date()): void {
    if (this.isVerified()) return;
    if (this.isRejected()) {   // un proveedor rechazado no se verifica directamente
      throw new InvalidVerificationTransitionError(
        `Cannot verify provider ${this.id}: it was rejected`,
      );
    }
    this.props.verificationStatus = VerificationStatus.VERIFIED;
    this.props.verificationNote = null;
    this.props.updatedAt = now;
  }

  // Se puede rechazar un proveedor pendiente o revocar uno ya verificado.
  reject(reason: string, now: Date = new Date()): void {
    if (!reason || reason.trim() === '') {
      throw new InvalidVerificationTransitionError('Rejecting a provider requires a reason');
    }
    if (this.isRejected()) return;
    this.props.verificationStatus = VerificationStatus.REJECTED;
    this.props.verificationNote = reason.trim();
    this.props.updatedAt = now;
  }

  toPrimitives(): ProviderPrimitives {
    return { ...this.props };
  }
}
