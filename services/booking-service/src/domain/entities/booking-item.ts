import { InvalidBookingError } from '../errors/domain.error';
import { BookingItemType } from '../value-objects/booking-item-type';

export interface BookingItemProps {
  id: string;
  type: BookingItemType;
  providerId: string;
  offerId: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

// Una línea de la reserva: un vuelo, una noche de hotel, un tour...
export class BookingItem {
  private constructor(private readonly props: BookingItemProps) {}

  static create(props: BookingItemProps): BookingItem {
    if (!props.providerId || !props.offerId) {
      throw new InvalidBookingError('Each item needs a providerId and an offerId');
    }
    if (!Number.isInteger(props.quantity) || props.quantity <= 0) {
      throw new InvalidBookingError('Item quantity must be a positive integer');
    }
    if (props.unitPrice < 0) {
      throw new InvalidBookingError('Item unitPrice cannot be negative');
    }
    return new BookingItem({ ...props });
  }

  get id(): string { return this.props.id; }
  get type(): BookingItemType { return this.props.type; }
  get providerId(): string { return this.props.providerId; }
  get offerId(): string { return this.props.offerId; }
  get description(): string { return this.props.description; }
  get quantity(): number { return this.props.quantity; }
  get unitPrice(): number { return this.props.unitPrice; }

  subtotal(): number {
    return this.props.quantity * this.props.unitPrice;
  }

  toPrimitives(): BookingItemProps {
    return { ...this.props };
  }
}