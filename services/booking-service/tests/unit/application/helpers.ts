import { IdGenerator } from '../../../src/application/ports/id-generator.port';
import { LoggerPort } from '../../../src/application/ports/logger.port';
import { CreateBookingInput } from '../../../src/application/dtos/booking.dto';
import { BookingItemType } from '../../../src/domain/value-objects/booking-item-type';

export const silentLogger: LoggerPort = { info: () => {}, warn: () => {}, error: () => {} };

// IDs predecibles para poder hacer asserts: id-1, id-2, ...
export class SequentialIdGenerator implements IdGenerator {
  private n = 0;
  generate(): string {
    this.n += 1;
    return `id-${this.n}`;
  }
}

export function createBookingInput(overrides: Partial<CreateBookingInput> = {}): CreateBookingInput {
  return {
    tripId: 'trip-1',
    userId: 'user-1',
    currency: 'COP',
    items: [
      {
        type: BookingItemType.TRANSPORT,
        providerId: 'prov-avianca',
        offerId: 'flight-BAQ-CTG',
        description: 'Vuelo Barranquilla - Cartagena',
        quantity: 1,
        unitPrice: 200000,
      },
      {
        type: BookingItemType.ACCOMMODATION,
        providerId: 'prov-hotel',
        offerId: 'room-123',
        description: 'Hotel, 2 noches',
        quantity: 2,
        unitPrice: 150000,
      },
    ],
    ...overrides,
  };
}