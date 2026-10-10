import { InsufficientCapacityError, InvalidServiceOfferError } from '../errors/domain.error';
import { ServiceOfferType } from '../value-objects/service-offer-type';

export interface ServiceOfferProps {
  id: string;
  providerId: string;
  type: ServiceOfferType;
  title: string;
  description: string;
  unitPrice: number;
  currency: string;
  availableCapacity: number;
  active: boolean;
  // Datos para ubicar este servicio en la API externa, los adapters lo leen para traducir la consulta
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceOfferProps {
  id: string;
  providerId: string;
  type: ServiceOfferType;
  title: string;
  description: string;
  unitPrice: number;
  currency: string;
  availableCapacity: number;
  active?: boolean;
  metadata?: Record<string, unknown>;
  now?: Date;
}

export type ServiceOfferPrimitives = ServiceOfferProps;

// Servicio especifico del proveedor (vuelo, habitación, tour)
// reservar y liberar pasan por reserve()/release(), así Saga evita dejar el cupo en negativo o encima del original
export class ServiceOffer {
  private constructor(private props: ServiceOfferProps) {}

  static create(input: CreateServiceOfferProps): ServiceOffer {
    if (!input.id) throw new InvalidServiceOfferError('An offer needs an id');
    if (!input.providerId) throw new InvalidServiceOfferError('An offer must belong to a provider');
    if (!input.title || input.title.trim() === '') {
      throw new InvalidServiceOfferError('An offer needs a title');
    }
    if (!(input.unitPrice >= 0)) {
      throw new InvalidServiceOfferError('Offer unitPrice cannot be negative');
    }
    if (!input.currency || input.currency.trim() === '') {
      throw new InvalidServiceOfferError('An offer needs a currency');
    }
    if (!Number.isInteger(input.availableCapacity) || input.availableCapacity < 0) {
      throw new InvalidServiceOfferError('Offer availableCapacity must be a non-negative integer');
    }
    const now = input.now ?? new Date();
    return new ServiceOffer({
      id: input.id,
      providerId: input.providerId,
      type: input.type,
      title: input.title.trim(),
      description: input.description,
      unitPrice: input.unitPrice,
      currency: input.currency,
      availableCapacity: input.availableCapacity,
      active: input.active ?? true,
      metadata: { ...(input.metadata ?? {}) },
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(props: ServiceOfferProps): ServiceOffer {
    return new ServiceOffer({ ...props });
  }

  get id(): string { return this.props.id; }
  get providerId(): string { return this.props.providerId; }
  get type(): ServiceOfferType { return this.props.type; }
  get title(): string { return this.props.title; }
  get description(): string { return this.props.description; }
  get unitPrice(): number { return this.props.unitPrice; }
  get currency(): string { return this.props.currency; }
  get availableCapacity(): number { return this.props.availableCapacity; }
  get active(): boolean { return this.props.active; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // Verificar reserva de x unidades (quantity)
  hasAvailability(quantity: number): boolean {
    return (
      this.props.active &&
      Number.isInteger(quantity) &&
      quantity > 0 &&
      this.props.availableCapacity >= quantity
    );
  }

  // Bloquea cupo (paso de la Saga que verifica y bloquea disponibilidad)
  reserve(quantity: number, now: Date = new Date()): void {
    this.assertValidQuantity(quantity);
    if (!this.props.active) {
      throw new InsufficientCapacityError(`Offer ${this.id} is not active`);
    }
    if (this.props.availableCapacity < quantity) { // si hay menos cupos que los solicitados
      throw new InsufficientCapacityError(
        `Offer ${this.id} has ${this.props.availableCapacity} units left, requested ${quantity}`,
      );
    }
    this.props.availableCapacity -= quantity;
    this.props.updatedAt = now;
  }

  // Devuelve cupo (compensación de la Saga o cancelación)
  release(quantity: number, now: Date = new Date()): void {
    this.assertValidQuantity(quantity);
    this.props.availableCapacity += quantity;
    this.props.updatedAt = now;
  }

  activate(now: Date = new Date()): void {
    this.props.active = true;
    this.props.updatedAt = now;
  }

  deactivate(now: Date = new Date()): void {
    this.props.active = false;
    this.props.updatedAt = now;
  }

  get metadata(): Readonly<Record<string, unknown>> { return this.props.metadata; }

  toPrimitives(): ServiceOfferPrimitives {
    return { ...this.props, metadata: { ...this.props.metadata } };
  }

  private assertValidQuantity(quantity: number): void {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new InvalidServiceOfferError('Quantity must be a positive integer');
    }
  }
}
