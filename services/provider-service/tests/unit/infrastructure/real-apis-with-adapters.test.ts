import { describe, expect, it } from 'vitest';
import { AlojamientoAdapter } from '../../../src/adapters/external/alojamiento.adapter';
import { ExternalProviderError } from '../../../src/adapters/external/errors';
import { TransporteAdapter } from '../../../src/adapters/external/transporte.adapter';
import { createExternalProviderRegistry } from '../../../src/infrastructure/external/external-providers.factory';
import { HotelsApiClient } from '../../../src/infrastructure/external/hotels-api.client';
import { SerpApiFlightsClient } from '../../../src/infrastructure/external/serpapi-flights.client';
import { ServiceOfferType } from '../../../src/domain/value-objects/service-offer-type';
import { fakeFetch, hotelsResponse, json, serpResponse } from './fake-fetch';

const flightMeta = (flightNumber: string) => ({
  originAirport: 'CDG', destinationAirport: 'AUS', departureDate: '2026-10-10', flightNumber,
});
const stayMeta = (hotelCode: string) => ({
  cityCode: 'Madrid', hotelCode, checkInDate: '2026-12-01', checkOutDate: '2026-12-03',
});

describe('TransporteAdapter + SerpApiFlightsClient', () => {
  const build = (respond: () => Response) =>
    new TransporteAdapter(new SerpApiFlightsClient({ apiKey: 'k', fetch: fakeFetch(respond).fn }));

  it('vuelo que aparece: disponible, con el precio de SerpApi y sin límite de asientos', async () => {
    const result = await build(() => json(serpResponse)).consultarDisponibilidad({
      offerId: 'o1', quantity: 2, metadata: flightMeta('AA 787 + AA 1457'),
    });

    expect(result.available).toBe(true);
    expect(result.unitPrice).toBe(905);
    expect(result.remainingUnits).toBeUndefined();
  });

  it('el número de vuelo de la oferta puede escribirse sin espacios ni en minúsculas', async () => {
    const result = await build(() => json(serpResponse)).consultarDisponibilidad({
      offerId: 'o1', quantity: 1, metadata: flightMeta('aa787+aa1457'),
    });

    expect(result.available).toBe(true);
  });

  it('vuelo que ya no aparece: no disponible', async () => {
    const result = await build(() => json(serpResponse)).consultarDisponibilidad({
      offerId: 'o1', quantity: 1, metadata: flightMeta('IB 999'),
    });

    expect(result).toMatchObject({ available: false, remainingUnits: 0 });
  });

  it('ruta sin resultados en Google Flights: no disponible (no es un fallo)', async () => {
    const result = await build(() => json({ error: "Google Flights hasn't returned any results for this query." }))
      .consultarDisponibilidad({ offerId: 'o1', quantity: 1, metadata: flightMeta('AA 787') });

    expect(result.available).toBe(false);
  });

  it('SerpApi caído o sin cuota: ExternalProviderError (la Saga compensa)', async () => {
    const adapter = build(() => json({ error: 'Your account has run out of searches.' }, 429));

    await expect(
      adapter.consultarDisponibilidad({ offerId: 'o1', quantity: 1, metadata: flightMeta('AA 787') }),
    ).rejects.toThrow(ExternalProviderError);
  });

  it('confirmarReserva devuelve el código simulado', async () => {
    const result = await build(() => json(serpResponse)).confirmarReserva({
      bookingId: 'booking-7', offerId: 'o1', quantity: 1, metadata: flightMeta('AA 787 + AA 1457'),
    });

    expect(result).toEqual({ success: true, reservationCode: 'SIM-FL-BOOKING7', confirmationCode: 'SIM-FL-BOOKING7-T' });
  });
});

describe('AlojamientoAdapter + HotelsApiClient', () => {
  const build = (respond: () => Response) =>
    new AlojamientoAdapter(new HotelsApiClient({ apiKey: 'k', fetch: fakeFetch(respond).fn }));

  it('hotel que aparece en el catálogo: disponible, sin precio ni habitaciones (los pone el catálogo de Wayvo)', async () => {
    const result = await build(() => json(hotelsResponse)).consultarDisponibilidad({
      offerId: 'o2', quantity: 2, metadata: stayMeta('698731'),
    });

    expect(result.available).toBe(true);
    expect(result.unitPrice).toBeUndefined();
    expect(result.remainingUnits).toBeUndefined();
  });

  it('hotel que no aparece entre los resultados: no disponible', async () => {
    const result = await build(() => json(hotelsResponse)).consultarDisponibilidad({
      offerId: 'o2', quantity: 1, metadata: stayMeta('000000'),
    });

    expect(result).toMatchObject({ available: false, remainingUnits: 0 });
    expect(result.reason).toMatch(/000000 not found in Madrid/);
  });

  it('API con error de clave: ExternalProviderError', async () => {
    const adapter = build(() => json({ message: 'Invalid API key' }, 401));

    await expect(
      adapter.consultarDisponibilidad({ offerId: 'o2', quantity: 1, metadata: stayMeta('698731') }),
    ).rejects.toThrow(ExternalProviderError);
  });

  it('confirmarReserva devuelve el código simulado', async () => {
    const result = await build(() => json(hotelsResponse)).confirmarReserva({
      bookingId: 'booking-7', offerId: 'o2', quantity: 1, metadata: stayMeta('698731'),
    });

    expect(result).toEqual({ success: true, reservationCode: 'SIM-HT-BOOKING7' });
  });
});

describe('createExternalProviderRegistry', () => {
  it('registra el adapter de transporte y el de alojamiento cuando están las dos claves', () => {
    const registry = createExternalProviderRegistry({ SERPAPI_API_KEY: 'a', HOTELS_API_KEY: 'b' });

    expect(registry.resolve(ServiceOfferType.TRANSPORT)).toBeInstanceOf(TransporteAdapter);
    expect(registry.resolve(ServiceOfferType.ACCOMMODATION)).toBeInstanceOf(AlojamientoAdapter);
  });

  it('falla indicando qué variables faltan, sin mostrar valores', () => {
    expect(() => createExternalProviderRegistry({ SERPAPI_API_KEY: 'a' })).toThrow(
      'Missing environment variables for external providers: HOTELS_API_KEY',
    );
    expect(() => createExternalProviderRegistry({})).toThrow(/SERPAPI_API_KEY, HOTELS_API_KEY/);
  });
});
