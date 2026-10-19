import { BookingItem } from '../../../src/domain/entities/booking-item';
import { BookingItemType } from '../../../src/domain/value-objects/booking-item-type';

export function makeItem(overrides: Partial<Parameters<typeof BookingItem.create>[0]> = {}): BookingItem {
  return BookingItem.create({
    id: 'item-1',
    type: BookingItemType.ACCOMMODATION,
    providerId: 'prov-1',
    offerId: 'offer-1',
    description: 'Hotel Cartagena, 2 noches',
    quantity: 2,
    unitPrice: 150000,
    ...overrides,
  });
}