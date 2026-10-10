import { describe, expect, it } from 'vitest';
import { HotelsApiClient } from '../../../src/infrastructure/external/hotels-api.client';
import { fakeFetch, hotelsResponse, json } from './fake-fetch';

const criteria = { cityCode: 'Madrid', checkInDate: '2026-12-01', checkOutDate: '2026-12-03', guests: 2 };
const KEY = 'hotels-secret-456';

describe('HotelsApiClient', () => {
  it('busca por ciudad con el header X-API-KEY', async () => {
    const { fn, calls } = fakeFetch(() => json(hotelsResponse));

    await new HotelsApiClient({ apiKey: KEY, fetch: fn, limit: 5 }).buscarHoteles(criteria);

    const url = new URL(calls[0].url);
    expect(url.origin + url.pathname).toBe('https://api.hotels-api.com/v2/hotels/search');
    expect(Object.fromEntries(url.searchParams)).toEqual({ city: 'Madrid', limit: '5' });
    expect(calls[0].headers).toEqual({ 'X-API-KEY': KEY });
    expect(calls[0].url).not.toContain(KEY); // la clave va en el header, no en la URL
  });

  it('traduce el catálogo: id numérico -> hotelCode texto; sin habitaciones ni tarifa', async () => {
    const { fn } = fakeFetch(() => json(hotelsResponse));

    const hotels = await new HotelsApiClient({ apiKey: KEY, fetch: fn }).buscarHoteles(criteria);

    expect(hotels).toEqual([
      { hotelCode: '698731', hotelName: 'NH Collection Madrid Abascal' },
      { hotelCode: '698733', hotelName: 'Hyatt Regency Hesperia Madrid' },
    ]);
  });

  it('descarta entradas sin id o sin nombre', async () => {
    const { fn } = fakeFetch(() => json({ success: true, data: [{ name: 'Sin id' }, { id: 1 }, { id: 2, name: 'Ok' }] }));

    const hotels = await new HotelsApiClient({ apiKey: KEY, fetch: fn }).buscarHoteles(criteria);

    expect(hotels).toEqual([{ hotelCode: '2', hotelName: 'Ok' }]);
  });

  it('success=false se lanza con el mensaje del API', async () => {
    const { fn } = fakeFetch(() => json({ success: false, data: null, message: 'City not found' }));

    await expect(new HotelsApiClient({ apiKey: KEY, fetch: fn }).buscarHoteles(criteria)).rejects.toThrow('City not found');
  });

  it('un error HTTP se lanza sin exponer la clave', async () => {
    const { fn } = fakeFetch(() => json({ message: 'Invalid API key' }, 401));

    const error = await new HotelsApiClient({ apiKey: KEY, fetch: fn }).buscarHoteles(criteria).catch((e) => e);

    expect(error.message).toBe('HTTP 401: Invalid API key');
    expect(error.message).not.toContain(KEY);
  });

  it('exige apiKey', () => {
    expect(() => new HotelsApiClient({ apiKey: '' })).toThrow(/apiKey/);
  });

  it('la reserva es simulada: siempre se confirma con un código SIM-', async () => {
    const result = await new HotelsApiClient({ apiKey: KEY }).reservarHabitacion({
      hotelCode: '698731', checkInDate: '2026-12-01', checkOutDate: '2026-12-03', rooms: 1, reference: 'booking-42',
    });

    expect(result).toEqual({ bookingRef: 'SIM-HT-BOOKING42', status: 'CONFIRMED' });
  });
});
