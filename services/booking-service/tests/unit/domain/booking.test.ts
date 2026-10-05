import { Booking } from '../../../src/domain/entities/booking';
import {
  InvalidBookingError,
  InvalidBookingStatusTransitionError,
} from '../../../src/domain/errors/domain.error';
import { BookingStatus } from '../../../src/domain/value-objects/booking-status';
import { makeItem } from './fixtures';

function makeBooking(): Booking {
  return Booking.create({
    id: 'booking-1',
    tripId: 'trip-1',
    userId: 'user-1',
    currency: 'COP',
    items: [makeItem({ quantity: 2, unitPrice: 100 }), makeItem({ id: 'item-2', quantity: 1, unitPrice: 50 })],
  });
}

describe('Booking', () => {
  it('nace en estado PENDING y calcula el total', () => {
    const booking = makeBooking();
    expect(booking.status).toBe(BookingStatus.PENDING);
    expect(booking.totalAmount()).toBe(250);
  });

  it('no se puede crear sin items, sin viaje o sin usuario', () => {
    const base = { id: 'b', tripId: 't', userId: 'u', currency: 'COP', items: [makeItem()] };
    expect(() => Booking.create({ ...base, items: [] })).toThrow(InvalidBookingError);
    expect(() => Booking.create({ ...base, tripId: '' })).toThrow(InvalidBookingError);
    expect(() => Booking.create({ ...base, userId: '' })).toThrow(InvalidBookingError);
  });

  it('pasa de PENDING a CONFIRMED', () => {
    const booking = makeBooking();
    booking.confirm();
    expect(booking.status).toBe(BookingStatus.CONFIRMED);
  });

  it('no permite confirmar una reserva cancelada', () => {
    const booking = makeBooking();
    booking.cancel('provider unavailable');
    expect(() => booking.confirm()).toThrow(InvalidBookingStatusTransitionError);
  });

  it('cancelar guarda el motivo y es idempotente (compensación segura de reintentar)', () => {
    const booking = makeBooking();
    const first = new Date('2026-10-05T10:00:00Z');
    booking.cancel('provider unavailable', first);
    booking.cancel('second attempt', new Date('2026-10-05T10:05:00Z'));

    expect(booking.status).toBe(BookingStatus.CANCELLED);
    expect(booking.cancellationReason).toBe('provider unavailable');
    expect(booking.updatedAt).toEqual(first);
  });

  it('expone sus datos planos con toPrimitives()', () => {
    const data = makeBooking().toPrimitives();
    expect(data.totalAmount).toBe(250);
    expect(data.items).toHaveLength(2);
    expect(data.status).toBe('PENDING');
  });
});