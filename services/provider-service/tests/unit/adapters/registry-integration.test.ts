import { describe, expect, it } from 'vitest';
import { AlojamientoAdapter } from '../../../src/adapters/external/alojamiento.adapter';
import { AdapterNotRegisteredError, ExternalProviderError } from '../../../src/adapters/external/errors';
import { ProveedorExternoRegistry } from '../../../src/adapters/external/proveedor-externo.registry';
import { TransporteAdapter } from '../../../src/adapters/external/transporte.adapter';
import { CheckAvailabilityUseCase } from '../../../src/application/use-cases/check-availability.use-case';
import { ProviderType } from '../../../src/domain/value-objects/provider-type';
import { ServiceOfferType } from '../../../src/domain/value-objects/service-offer-type';
import { makeOffer, makeProvider } from '../domain/fixtures';
import { seedCatalog, silentLogger } from '../application/helpers';
import { FakeAlojamientoApi, FakeTransporteApi, flightMetadata, stayMetadata } from './fakes';

describe('ProveedorExternoRegistry', () => {
  it('devuelve el adapter registrado para cada tipo', () => {
    const transporte = new TransporteAdapter(new FakeTransporteApi());
    const alojamiento = new AlojamientoAdapter(new FakeAlojamientoApi());
    const registry = new ProveedorExternoRegistry({
      [ServiceOfferType.TRANSPORT]: transporte,
      [ServiceOfferType.ACCOMMODATION]: alojamiento,
    });

    expect(registry.resolve(ServiceOfferType.TRANSPORT)).toBe(transporte);
    expect(registry.resolve(ServiceOfferType.ACCOMMODATION)).toBe(alojamiento);
  });

  it('falla con AdapterNotRegisteredError para un tipo sin adapter', () => {
    const registry = new ProveedorExternoRegistry({});

    expect(() => registry.resolve(ServiceOfferType.ACTIVITY)).toThrow(AdapterNotRegisteredError);
  });
});

// CheckAvailabilityUseCase -> registry -> adapters -> APIs externas (falsas): el patrón completo.
describe('CheckAvailabilityUseCase con los adapters reales', () => {
  async function build() {
    const catalog = await seedCatalog(); // proveedor prov-1 (TRANSPORT) verificado
    await catalog.offers.save(makeOffer({ metadata: flightMetadata }));

    const hotelProvider = makeProvider({ id: 'prov-2', type: ProviderType.ACCOMMODATION });
    hotelProvider.verify();
    await catalog.providers.save(hotelProvider);
    await catalog.offers.save(
      makeOffer({
        id: 'offer-2',
        providerId: 'prov-2',
        type: ServiceOfferType.ACCOMMODATION,
        availableCapacity: 5,
        metadata: stayMetadata,
      }),
    );

    const transporteApi = new FakeTransporteApi();
    const alojamientoApi = new FakeAlojamientoApi();
    const useCase = new CheckAvailabilityUseCase(
      catalog.providers,
      catalog.offers,
      new ProveedorExternoRegistry({
        [ServiceOfferType.TRANSPORT]: new TransporteAdapter(transporteApi),
        [ServiceOfferType.ACCOMMODATION]: new AlojamientoAdapter(alojamientoApi),
      }),
      silentLogger,
    );
    return { useCase, transporteApi, alojamientoApi };
  }

  const bothItems = {
    items: [
      { type: ServiceOfferType.TRANSPORT, providerId: 'prov-1', offerId: 'offer-1', quantity: 2 },
      { type: ServiceOfferType.ACCOMMODATION, providerId: 'prov-2', offerId: 'offer-2', quantity: 1 },
    ],
  };

  it('vuelo + hotel disponibles: cada ítem llega a su API con el formato de ese proveedor', async () => {
    const { useCase, transporteApi, alojamientoApi } = await build();

    const output = await useCase.execute(bothItems);

    expect(output.available).toBe(true);
    expect(transporteApi.searches[0]).toMatchObject({ originAirport: 'BAQ', passengers: 2 });
    expect(alojamientoApi.searches[0]).toMatchObject({ cityCode: 'CTG', guests: 1 });
  });

  it('el hotel se queda sin habitaciones: available=false y el motivo viene del proveedor', async () => {
    const { useCase, alojamientoApi } = await build();
    alojamientoApi.hotels = [];

    const output = await useCase.execute(bothItems);

    expect(output.available).toBe(false);
    expect(output.details.map((d) => d.available)).toEqual([true, false]);
    expect(output.reason).toMatch(/offer-2: Hotel HTL-CTG-1 not found/);
  });

  it('la API de vuelos se cae: el caso de uso lanza ExternalProviderError (la Saga compensa)', async () => {
    const { useCase, transporteApi } = await build();
    transporteApi.failWith = new Error('ECONNRESET');

    await expect(useCase.execute(bothItems)).rejects.toThrow(ExternalProviderError);
  });
});
