import { beforeEach, describe, expect, it } from 'vitest';
import { CheckAvailabilityUseCase } from '../../../src/application/use-cases/check-availability.use-case';
import { CheckAvailabilityInput } from '../../../src/application/dtos/availability.dto';
import { InvalidAvailabilityRequestError } from '../../../src/application/errors/application.error';
import { ProviderType } from '../../../src/domain/value-objects/provider-type';
import { ServiceOfferType } from '../../../src/domain/value-objects/service-offer-type';
import { makeOffer, makeProvider } from '../domain/fixtures';
import { FakeProveedorExterno, FakeResolver, recordingLogger, seedCatalog, silentLogger } from './helpers';

const request = (overrides: Partial<CheckAvailabilityInput['items'][number]> = {}): CheckAvailabilityInput => ({
  items: [
    { type: ServiceOfferType.TRANSPORT, providerId: 'prov-1', offerId: 'offer-1', quantity: 2, ...overrides },
  ],
});

describe('CheckAvailabilityUseCase', () => {
  let external: FakeProveedorExterno;

  beforeEach(() => {
    external = new FakeProveedorExterno();
  });

  async function build(opts: { verified?: boolean; logger?: typeof silentLogger } = {}) {
    const catalog = await seedCatalog({ verified: opts.verified });
    const useCase = new CheckAvailabilityUseCase(
      catalog.providers,
      catalog.offers,
      new FakeResolver({ [ServiceOfferType.TRANSPORT]: external }),
      opts.logger ?? silentLogger,
    );
    return { ...catalog, useCase };
  }

  it('responde available=true cuando el catálogo y el proveedor externo tienen cupo', async () => {
    const { useCase } = await build();

    const output = await useCase.execute(request({ quantity: 2 }));

    expect(output.available).toBe(true);
    expect(output.reason).toBeUndefined();
    expect(output.details).toEqual([
      { offerId: 'offer-1', providerId: 'prov-1', available: true, remainingCapacity: 10 },
    ]);
    expect(external.calls).toEqual([{ offerId: 'offer-1', quantity: 2, metadata: {} }]);
  });

  it('le pasa al adapter la metadata de la oferta para que pueda ubicarla en la API externa', async () => {
    const catalog = await seedCatalog();
    await catalog.offers.save(makeOffer({ metadata: { flightNumber: 'AV123', originAirport: 'BAQ' } }));
    const useCase = new CheckAvailabilityUseCase(
      catalog.providers,
      catalog.offers,
      new FakeResolver({ [ServiceOfferType.TRANSPORT]: external }),
      silentLogger,
    );

    await useCase.execute(request());

    expect(external.calls[0].metadata).toEqual({ flightNumber: 'AV123', originAirport: 'BAQ' });
  });

  it('no reserva ni descuenta cupo: solo consulta', async () => {
    const { useCase, offers } = await build();

    await useCase.execute(request({ quantity: 4 }));

    expect((await offers.findById('offer-1'))?.availableCapacity).toBe(10);
  });

  it('reporta el cupo restante más bajo entre el catálogo y el proveedor externo', async () => {
    external.response = { available: true, remainingUnits: 3 };
    const { useCase } = await build();

    const output = await useCase.execute(request());

    expect(output.details[0].remainingCapacity).toBe(3);
  });

  it('available=false si la oferta no existe, sin consultar al externo', async () => {
    const { useCase } = await build();

    const output = await useCase.execute(request({ offerId: 'nope' }));

    expect(output.available).toBe(false);
    expect(output.details[0].reason).toBe('Offer not found');
    expect(external.calls).toHaveLength(0);
  });

  it('available=false si la oferta es de otro proveedor', async () => {
    const { useCase } = await build();

    const output = await useCase.execute(request({ providerId: 'prov-otro' }));

    expect(output.available).toBe(false);
    expect(output.details[0].reason).toMatch(/does not belong/);
    expect(external.calls).toHaveLength(0);
  });

  it('available=false si el tipo pedido no coincide con el de la oferta', async () => {
    const { useCase } = await build();

    const output = await useCase.execute(request({ type: ServiceOfferType.ACCOMMODATION }));

    expect(output.available).toBe(false);
    expect(output.details[0].reason).toMatch(/type TRANSPORT/);
  });

  it('available=false si el proveedor está PENDING (no verificado), sin consultar al externo', async () => {
    const { useCase } = await build({ verified: false });

    const output = await useCase.execute(request());

    expect(output.available).toBe(false);
    expect(output.details[0].reason).toMatch(/not verified.*PENDING/);
    expect(external.calls).toHaveLength(0);
  });

  it('available=false si el proveedor fue rechazado', async () => {
    const { useCase, providers, provider } = await build();
    provider.reject('Quejas reiteradas');
    await providers.save(provider);

    const output = await useCase.execute(request());

    expect(output.available).toBe(false);
    expect(output.details[0].reason).toMatch(/REJECTED/);
  });

  it('available=false si la oferta está inactiva', async () => {
    const { useCase, offers, offer } = await build();
    offer.deactivate();
    await offers.save(offer);

    const output = await useCase.execute(request());

    expect(output.available).toBe(false);
    expect(output.details[0].reason).toBe('Offer is not active');
    expect(external.calls).toHaveLength(0);
  });

  it('available=false con el cupo restante si el catálogo no alcanza, sin consultar al externo', async () => {
    const { useCase } = await build();

    const output = await useCase.execute(request({ quantity: 11 }));

    expect(output.available).toBe(false);
    expect(output.details[0].remainingCapacity).toBe(10);
    expect(output.details[0].reason).toMatch(/requested 11, available 10/);
    expect(external.calls).toHaveLength(0);
  });

  it('available=false con el motivo del proveedor externo si éste no tiene cupo', async () => {
    external.response = { available: false, remainingUnits: 0, reason: 'Vuelo agotado' };
    const { useCase } = await build();

    const output = await useCase.execute(request());

    expect(output.available).toBe(false);
    expect(output.details[0].reason).toBe('Vuelo agotado');
    expect(output.reason).toBe('offer-1: Vuelo agotado');
  });

  it('con varios ítems devuelve el detalle de cada uno y available=false si falla alguno', async () => {
    const catalog = await seedCatalog();
    const hotel = makeProvider({ id: 'prov-2', type: ProviderType.ACCOMMODATION });
    hotel.verify();
    await catalog.providers.save(hotel);
    await catalog.offers.save(
      makeOffer({ id: 'offer-2', providerId: 'prov-2', type: ServiceOfferType.ACCOMMODATION, availableCapacity: 1 }),
    );
    const hotelExternal = new FakeProveedorExterno();
    const useCase = new CheckAvailabilityUseCase(
      catalog.providers,
      catalog.offers,
      new FakeResolver({
        [ServiceOfferType.TRANSPORT]: external,
        [ServiceOfferType.ACCOMMODATION]: hotelExternal,
      }),
      silentLogger,
    );

    const output = await useCase.execute({
      items: [
        { type: ServiceOfferType.TRANSPORT, providerId: 'prov-1', offerId: 'offer-1', quantity: 1 },
        { type: ServiceOfferType.ACCOMMODATION, providerId: 'prov-2', offerId: 'offer-2', quantity: 2 },
      ],
    });

    expect(output.available).toBe(false);
    expect(output.details.map((d) => d.available)).toEqual([true, false]);
    expect(output.reason).toMatch(/^offer-2:/);
    expect(external.calls).toHaveLength(1); // el ítem bueno sí se consultó
    expect(hotelExternal.calls).toHaveLength(0); // el malo falló antes, en el catálogo
  });

  it('si el proveedor externo falla de verdad, lanza el error y lo loguea con el correlationId', async () => {
    external.failWith = new Error('ECONNRESET');
    const { logger, errors } = recordingLogger();
    const { useCase } = await build({ logger });

    await expect(useCase.execute({ ...request(), correlationId: 'corr-9' })).rejects.toThrow('ECONNRESET');

    expect(errors).toHaveLength(1);
    expect(errors[0].meta).toMatchObject({ correlationId: 'corr-9', offerId: 'offer-1', error: 'ECONNRESET' });
  });

  it('rechaza solicitudes sin ítems o con cantidades inválidas', async () => {
    const { useCase } = await build();

    await expect(useCase.execute({ items: [] })).rejects.toThrow(InvalidAvailabilityRequestError);
    await expect(useCase.execute(request({ quantity: 0 }))).rejects.toThrow(InvalidAvailabilityRequestError);
    await expect(useCase.execute(request({ quantity: 1.5 }))).rejects.toThrow(InvalidAvailabilityRequestError);
  });
});
