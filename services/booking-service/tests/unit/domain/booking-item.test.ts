import { InvalidBookingError } from '../../../src/domain/errors/domain.error';
import { makeItem } from './fixtures';

describe('BookingItem', () => {
  it('calcula el subtotal como cantidad x precio unitario', () => {
    expect(makeItem({ quantity: 3, unitPrice: 100 }).subtotal()).toBe(300);
  });

  it('rechaza cantidades no positivas', () => {
    expect(() => makeItem({ quantity: 0 })).toThrow(InvalidBookingError);
    expect(() => makeItem({ quantity: 1.5 })).toThrow(InvalidBookingError);
  });

  it('rechaza precios negativos', () => {
    expect(() => makeItem({ unitPrice: -1 })).toThrow(InvalidBookingError);
  });

  it('exige providerId y offerId', () => {
    expect(() => makeItem({ providerId: '' })).toThrow(InvalidBookingError);
    expect(() => makeItem({ offerId: '' })).toThrow(InvalidBookingError);
  });
});