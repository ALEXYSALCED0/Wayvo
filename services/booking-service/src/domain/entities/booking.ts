import { InvalidBookingError, InvalidBookingStatusTransitionError } from '../errors/domain.error';
import { BookingStatus } from '../value-objects/booking-status';
import { BookingItem, BookingItemProps } from './booking-item';

export interface BookingProps {
  id: string;
  tripId: string;
  userId: string;
  currency: string;
  items: BookingItem[];
  status: BookingStatus;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBookingProps {
  id: string;
  tripId: string;
  userId: string;
  currency: string;
  items: BookingItem[];
  now?: Date;
}

export interface BookingPrimitives extends Omit<BookingProps, 'items'> {
  items: BookingItemProps[];
  totalAmount: number;
}

// Aggregate root: todas las reglas sobre el estado de la reserva viven aquí.
// Nadie de afuera puede cambiar `status` directamente; solo con confirm()/cancel().
export class Booking {
  private constructor(private props: BookingProps) {}

  static create(input: CreateBookingProps): Booking {
    if (!input.tripId) throw new InvalidBookingError('A booking must belong to a trip');
    if (!input.userId) throw new InvalidBookingError('A booking must belong to a user');
    if (input.items.length === 0) {
      throw new InvalidBookingError('A booking needs at least one item');
    }
    const now = input.now ?? new Date();
    return new Booking({
      id: input.id,
      tripId: input.tripId,
      userId: input.userId,
      currency: input.currency,
      items: [...input.items],
      status: BookingStatus.PENDING,
      cancellationReason: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Reconstruye una reserva ya existente (por ejemplo desde la base de datos)
  // sin volver a aplicar las validaciones de creación.
  static restore(props: BookingProps): Booking {
    return new Booking({ ...props, items: [...props.items] });
  }

  get id(): string { return this.props.id; }
  get tripId(): string { return this.props.tripId; }
  get userId(): string { return this.props.userId; }
  get currency(): string { return this.props.currency; }
  get items(): readonly BookingItem[] { return this.props.items; }
  get status(): BookingStatus { return this.props.status; }
  get cancellationReason(): string | null { return this.props.cancellationReason; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  totalAmount(): number {
    return this.props.items.reduce((sum, item) => sum + item.subtotal(), 0);
  }

  isPending(): boolean { return this.props.status === BookingStatus.PENDING; }
  isConfirmed(): boolean { return this.props.status === BookingStatus.CONFIRMED; }
  isCancelled(): boolean { return this.props.status === BookingStatus.CANCELLED; }

  // Paso final del flujo feliz de la Saga.
  confirm(now: Date = new Date()): void {
    if (!this.isPending()) {
      throw new InvalidBookingStatusTransitionError(
        `Cannot confirm booking ${this.id} in status ${this.status}`,
      );
    }
    this.props.status = BookingStatus.CONFIRMED;
    this.props.updatedAt = now;
  }

  // Transacción de compensación de la Saga. Es idempotente: si la Saga reintenta
  // la compensación y la reserva ya estaba cancelada, no falla ni cambia nada.
  cancel(reason: string, now: Date = new Date()): void {
    if (this.isCancelled()) return;
    this.props.status = BookingStatus.CANCELLED;
    this.props.cancellationReason = reason;
    this.props.updatedAt = now;
  }

  toPrimitives(): BookingPrimitives {
    return {
      ...this.props,
      items: this.props.items.map((item) => item.toPrimitives()),
      totalAmount: this.totalAmount(),
    };
  }
}