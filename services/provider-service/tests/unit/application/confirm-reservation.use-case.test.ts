import { describe, expect, it } from 'vitest';
import {
  ConfirmacionResultado,
  DisponibilidadQuery,
  DisponibilidadResultado,
  IProveedorExterno,
  ReservaDatos,
} from '../../../src/application/ports/proveedor-externo.port';
import {
  InvalidReservationRequestError,
  ReservationRejectedError,
} from '../../../src/application/errors/application.error';
import { ConfirmReservationUseCase } from '../../../src/application/use-cases/confirm-reservation.use-case';
import { ServiceOfferType } from '../../../src/domain/value-objects/service-offer-type';
import { InMemoryProviderRepository } from '../../../src/infrastructure/persistence/in-memory-provider.repository';
import { InMemoryServiceOfferRepository } from '../../../src/infrastructure/persistence/in-memory-service-offer.repository';
import { makeOffer, makeProvider } from '../domain/fixtures';
import { FakeResolver, recordingLogger, silentLogger } from './helpers';

class ConfirmingExternal implements IProveedorExterno {
  confirmations: ReservaDatos[] = [];
  results: Array<ConfirmacionResultado | Error> = [];

  async consultarDisponibilidad(_q: DisponibilidadQuery): Promise<DisponibilidadResultado> {
    return { available: true };
  }

  async confirmarReserva(datos: ReservaDatos): Promise<ConfirmacionResultado> {
    this.confirmations.push(datos);
    const next = this.results.shift() ?? { success: true, reservationCode: `PNR-${this.confirmations.length}` };
    if (next instanceof Error) throw next;
    return next;
  }
}

async function setup(opts: { verified?: boolean } = {}) {
  const providers = new InMemoryProviderRepository();
  const offers = new InMemoryServiceOfferRepository();
  const provider = makeProvider();
  if (opts.verified !== false) provider.verify();
  await providers.save(provider);
  await offers.save(makeOffer({ id: 'offer-1', availableCapacity: 10, metadata: { flightNumber: 'WY100' } }));
  await offers.save(makeOffer({ id: 'offer-2', availableCapacity: 5, title: 'Otro vuelo' }));
  const external = new ConfirmingExternal();
  const recorded = recordingLogger();
  const useCase = new ConfirmReservationUseCase(
    providers, offers, new FakeResolver({ [ServiceOfferType.TRANSPORT]: external }), recorded.logger,
  );
  return { useCase, providers, offers, external, errors: recorded.errors };
}

const item = (offerId: string, quantity: number) => ({
  type: ServiceOfferType.TRANSPORT, providerId: 'prov-1', offerId, quantity,
});

describe('ConfirmReservationUseCase', () => {
  it('confirma con el proveedor, descuenta el cupo y devuelve los códigos', async () => {
    const { useCase, offers, external } = await setup();

    const result = await useCase.execute({ bookingId: 'b1', items: [item('offer-1', 3)] });

    expect(result).toMatchObject({
      bookingId: 'b1',
      reservationCode: 'RES-b1',
      confirmationCode: 'PNR-1',
      items: [{ offerId: 'offer-1', providerId: 'prov-1', quantity: 3, reservationCode: 'PNR-1' }],
    });
    expect(new Date(result.confirmedAt).getTime()).not.toBeNaN();
    expect((await offers.findById('offer-1'))!.availableCapacity).toBe(7);
    expect(external.confirmations[0]).toMatchObject({
      bookingId: 'b1', offerId: 'offer-1', quantity: 3, metadata: { flightNumber: 'WY100' },
    });
  });

  it('varios items: confirma todos y junta los códigos', async () => {
    const { useCase, offers, external } = await setup();
    external.results = [
      { success: true, reservationCode: 'PNR-A', confirmationCode: 'TK-A' },
      { success: true, reservationCode: 'PNR-B' },
    ];

    const result = await useCase.execute({ bookingId: 'b2', items: [item('offer-1', 2), item('offer-2', 1)] });

    expect(result.confirmationCode).toBe('PNR-A,TK-A,PNR-B');
    expect((await offers.findById('offer-1'))!.availableCapacity).toBe(8);
    expect((await offers.findById('offer-2'))!.availableCapacity).toBe(4);
  });

  it('el proveedor rechaza el segundo item: se devuelve el cupo del primero y se propaga el rechazo', async () => {
    const { useCase, offers, external, errors } = await setup();
    external.results = [{ success: true, reservationCode: 'PNR-A' }, { success: false, reason: 'Sold out' }];

    await expect(
      useCase.execute({ bookingId: 'b3', items: [item('offer-1', 4), item('offer-2', 1)] }),
    ).rejects.toThrow(ReservationRejectedError);

    expect((await offers.findById('offer-1'))!.availableCapacity).toBe(10);
    expect((await offers.findById('offer-2'))!.availableCapacity).toBe(5);
    expect(errors).toHaveLength(0);
  });

  it('falla técnica del proveedor: se propaga y se revierte lo anterior', async () => {
    const { useCase, offers, external, errors } = await setup();
    external.results = [{ success: true }, new Error('provider down')];

    await expect(
      useCase.execute({ bookingId: 'b4', items: [item('offer-1', 4), item('offer-2', 1)] }),
    ).rejects.toThrow('provider down');

    expect((await offers.findById('offer-1'))!.availableCapacity).toBe(10);
    expect(errors.map((e) => e.message)).toContain('External provider failed while confirming reservation');
  });

  it.each([
    ['la oferta no existe', item('nope', 1), 'Offer not found'],
    ['la oferta es de otro proveedor', { ...item('offer-1', 1), providerId: 'other' }, 'does not belong'],
    ['el tipo no coincide', { ...item('offer-1', 1), type: ServiceOfferType.ACCOMMODATION }, 'is of type TRANSPORT'],
    ['no alcanza el cupo local', item('offer-1', 11), 'Not enough capacity'],
  ])('rechaza sin llamar al proveedor cuando %s', async (_name, bad, text) => {
    const { useCase, external } = await setup();
    await expect(useCase.execute({ bookingId: 'b5', items: [bad] })).rejects.toThrow(text);
    expect(external.confirmations).toHaveLength(0);
  });

  it('rechaza si el proveedor ya no está verificado', async () => {
    const { useCase, external } = await setup({ verified: false });
    await expect(useCase.execute({ bookingId: 'b6', items: [item('offer-1', 1)] })).rejects.toThrow(
      'Provider is not verified',
    );
    expect(external.confirmations).toHaveLength(0);
  });

  it('rechaza si la oferta fue desactivada después de consultar', async () => {
    const { useCase, offers } = await setup();
    const offer = (await offers.findById('offer-1'))!;
    offer.deactivate();
    await offers.save(offer);
    await expect(useCase.execute({ bookingId: 'b7', items: [item('offer-1', 1)] })).rejects.toThrow('not active');
  });

  it('la misma oferta dos veces suma las cantidades', async () => {
    const { useCase, offers } = await setup();
    await useCase.execute({ bookingId: 'b8', items: [item('offer-1', 4), item('offer-1', 4)] });
    expect((await offers.findById('offer-1'))!.availableCapacity).toBe(2);
    await expect(
      useCase.execute({ bookingId: 'b9', items: [item('offer-1', 2), item('offer-1', 1)] }),
    ).rejects.toThrow('Not enough capacity');
    expect((await offers.findById('offer-1'))!.availableCapacity).toBe(2);
  });

  it('valida la solicitud', async () => {
    const { useCase } = await setup();
    await expect(useCase.execute({ bookingId: '', items: [item('offer-1', 1)] })).rejects.toThrow(InvalidReservationRequestError);
    await expect(useCase.execute({ bookingId: 'b', items: [] })).rejects.toThrow(InvalidReservationRequestError);
    await expect(useCase.execute({ bookingId: 'b', items: [item('offer-1', 0)] })).rejects.toThrow(InvalidReservationRequestError);
    await expect(useCase.execute({ bookingId: 'b', items: [item('offer-1', 1.5)] })).rejects.toThrow(InvalidReservationRequestError);
  });

  it('usa un logger silencioso sin problemas', async () => {
    const { providers, offers, external } = await setup();
    const useCase = new ConfirmReservationUseCase(providers, offers, new FakeResolver({ [ServiceOfferType.TRANSPORT]: external }), silentLogger);
    await expect(useCase.execute({ bookingId: 'b10', items: [item('offer-1', 1)] })).resolves.toBeDefined();
  });
});
