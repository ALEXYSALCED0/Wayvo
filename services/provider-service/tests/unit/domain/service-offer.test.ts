import { describe, expect, it } from 'vitest';
import {
  InsufficientCapacityError,
  InvalidServiceOfferError,
} from '../../../src/domain/errors/domain.error';
import { makeOffer } from './fixtures';

describe('ServiceOffer', () => {
  it('reserve() descuenta cupo y release() lo devuelve', () => {
    const offer = makeOffer({ availableCapacity: 10 });
    offer.reserve(4);
    expect(offer.availableCapacity).toBe(6);
    offer.release(4);
    expect(offer.availableCapacity).toBe(10);
  });

  it('reserve() falla si no alcanza el cupo y no lo modifica', () => {
    const offer = makeOffer({ availableCapacity: 2 });
    expect(() => offer.reserve(3)).toThrow(InsufficientCapacityError);
    expect(offer.availableCapacity).toBe(2);
  });

  it('una oferta inactiva no tiene disponibilidad ni se puede reservar', () => {
    const offer = makeOffer({ active: false });
    expect(offer.hasAvailability(1)).toBe(false);
    expect(() => offer.reserve(1)).toThrow(InsufficientCapacityError);
  });

  it('hasAvailability() respeta el cupo y rechaza cantidades inválidas', () => {
    const offer = makeOffer({ availableCapacity: 5 });
    expect(offer.hasAvailability(5)).toBe(true);
    expect(offer.hasAvailability(6)).toBe(false);
    expect(offer.hasAvailability(0)).toBe(false);
    expect(offer.hasAvailability(1.5)).toBe(false);
  });

  it('deactivate() y activate() cambian la disponibilidad', () => {
    const offer = makeOffer();
    offer.deactivate();
    expect(offer.hasAvailability(1)).toBe(false);
    offer.activate();
    expect(offer.hasAvailability(1)).toBe(true);
  });

  it('rechaza cantidades no positivas o fraccionarias al reservar y liberar', () => {
    const offer = makeOffer();
    expect(() => offer.reserve(0)).toThrow(InvalidServiceOfferError);
    expect(() => offer.release(-1)).toThrow(InvalidServiceOfferError);
    expect(() => offer.release(1.5)).toThrow(InvalidServiceOfferError);
  });

  it('valida precio, cupo, proveedor y título al crear', () => {
    expect(() => makeOffer({ unitPrice: -1 })).toThrow(InvalidServiceOfferError);
    expect(() => makeOffer({ availableCapacity: -1 })).toThrow(InvalidServiceOfferError);
    expect(() => makeOffer({ availableCapacity: 1.5 })).toThrow(InvalidServiceOfferError);
    expect(() => makeOffer({ providerId: '' })).toThrow(InvalidServiceOfferError);
    expect(() => makeOffer({ title: ' ' })).toThrow(InvalidServiceOfferError);
  });
});
