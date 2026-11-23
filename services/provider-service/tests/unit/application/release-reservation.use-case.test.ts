import { describe, expect, it } from 'vitest';
import { InvalidReservationRequestError } from '../../../src/application/errors/application.error';
import { ReleaseReservationUseCase } from '../../../src/application/use-cases/release-reservation.use-case';
import { InMemoryServiceOfferRepository } from '../../../src/infrastructure/persistence/in-memory-service-offer.repository';
import { makeOffer } from '../domain/fixtures';
import { silentLogger } from './helpers';

async function setup() {
  const offers = new InMemoryServiceOfferRepository();
  await offers.save(makeOffer({ id: 'offer-1', availableCapacity: 10 }));
  await offers.save(makeOffer({ id: 'offer-2', availableCapacity: 5, title: 'Otro vuelo' }));
  return { offers, useCase: new ReleaseReservationUseCase(offers, silentLogger) };
}

describe('ReleaseReservationUseCase', () => {
  it('devuelve el cupo de cada item', async () => {
    const { offers, useCase } = await setup();
    // se aparta primero, como haría /confirm
    await offers.tryReserve('offer-1', 3);
    await offers.tryReserve('offer-2', 2);

    const result = await useCase.execute({
      bookingId: 'b-1',
      items: [{ offerId: 'offer-1', quantity: 3 }, { offerId: 'offer-2', quantity: 2 }],
    });

    expect(result.items.every((i) => i.released)).toBe(true);
    expect((await offers.findById('offer-1'))!.availableCapacity).toBe(10);
    expect((await offers.findById('offer-2'))!.availableCapacity).toBe(5);
  });

  it('una oferta inexistente se informa pero no impide liberar las demás', async () => {
    const { offers, useCase } = await setup();
    await offers.tryReserve('offer-2', 2);

    const result = await useCase.execute({
      bookingId: 'b-1',
      items: [{ offerId: 'ghost', quantity: 1 }, { offerId: 'offer-2', quantity: 2 }],
    });

    expect(result.items[0]).toMatchObject({ offerId: 'ghost', released: false, reason: 'Offer not found' });
    expect(result.items[1]).toMatchObject({ offerId: 'offer-2', released: true });
    expect((await offers.findById('offer-2'))!.availableCapacity).toBe(5);
  });

  it('si el repositorio falla, lo informa y sigue con el resto', async () => {
    const { offers, useCase } = await setup();
    const original = offers.releaseCapacity.bind(offers);
    offers.releaseCapacity = async (id, q) => {
      if (id === 'offer-1') throw new Error('db down');
      return original(id, q);
    };
    await offers.tryReserve('offer-2', 2);

    const result = await useCase.execute({
      bookingId: 'b-1',
      items: [{ offerId: 'offer-1', quantity: 1 }, { offerId: 'offer-2', quantity: 2 }],
    });

    expect(result.items[0]).toMatchObject({ released: false, reason: 'db down' });
    expect(result.items[1].released).toBe(true);
  });

  it('rechaza solicitudes inválidas', async () => {
    const { useCase } = await setup();
    await expect(useCase.execute({ bookingId: '', items: [{ offerId: 'offer-1', quantity: 1 }] }))
      .rejects.toBeInstanceOf(InvalidReservationRequestError);
    await expect(useCase.execute({ bookingId: 'b', items: [] }))
      .rejects.toBeInstanceOf(InvalidReservationRequestError);
    await expect(useCase.execute({ bookingId: 'b', items: [{ offerId: 'offer-1', quantity: 0 }] }))
      .rejects.toBeInstanceOf(InvalidReservationRequestError);
  });
});
