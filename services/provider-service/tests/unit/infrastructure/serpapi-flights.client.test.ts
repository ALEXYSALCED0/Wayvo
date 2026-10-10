import { describe, expect, it } from 'vitest';
import { SerpApiFlightsClient } from '../../../src/infrastructure/external/serpapi-flights.client';
import { fakeFetch, json, serpResponse } from './fake-fetch';

const criteria = { originAirport: 'CDG', destinationAirport: 'AUS', departureDate: '2026-10-10', passengers: 2 };
const KEY = 'secret-key-123';

describe('SerpApiFlightsClient', () => {
  it('arma la consulta de google_flights con los parámetros de SerpApi', async () => {
    const { fn, calls } = fakeFetch(() => json(serpResponse));
    const client = new SerpApiFlightsClient({ apiKey: KEY, fetch: fn });

    await client.buscarVuelos({ ...criteria, cabinClass: 'business' });

    const url = new URL(calls[0].url);
    expect(url.origin + url.pathname).toBe('https://serpapi.com/search.json');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      engine: 'google_flights',
      departure_id: 'CDG',
      arrival_id: 'AUS',
      outbound_date: '2026-10-10',
      type: '2',
      adults: '2',
      currency: 'COP',
      hl: 'en',
      travel_class: '3',
      api_key: KEY,
    });
  });

  it('une best_flights y other_flights y descarta los itinerarios sin precio', async () => {
    const { fn } = fakeFetch(() => json(serpResponse));

    const flights = await new SerpApiFlightsClient({ apiKey: KEY, fetch: fn }).buscarVuelos(criteria);

    expect(flights.map((f) => f.flightNumber)).toEqual(['AA 787 + AA 1457', 'AF 100']);
  });

  it('traduce un itinerario con escala: números unidos, horas del primer y último tramo, precio', async () => {
    const { fn } = fakeFetch(() => json(serpResponse));

    const [flight] = await new SerpApiFlightsClient({ apiKey: KEY, fetch: fn }).buscarVuelos(criteria);

    expect(flight).toEqual({
      flightNumber: 'AA 787 + AA 1457',
      airline: 'American',
      pricePerSeat: 905,
      departureIso: '2026-10-10T12:15:00',
      arrivalIso: '2026-10-10T18:57:00',
    });
    expect(flight.seatsAvailable).toBeUndefined(); // SerpApi no informa asientos
  });

  it('"sin resultados" de SerpApi es una lista vacía, no un error', async () => {
    const { fn } = fakeFetch(() => json({ error: "Google Flights hasn't returned any results for this query." }));

    await expect(new SerpApiFlightsClient({ apiKey: KEY, fetch: fn }).buscarVuelos(criteria)).resolves.toEqual([]);
  });

  it('otros errores de SerpApi se lanzan', async () => {
    const { fn } = fakeFetch(() => json({ error: 'Invalid API key. Your API key should be here: https://serpapi.com/manage-api-key' }));

    await expect(new SerpApiFlightsClient({ apiKey: KEY, fetch: fn }).buscarVuelos(criteria)).rejects.toThrow(/Invalid API key/);
  });

  it('un error HTTP se lanza sin exponer la api_key', async () => {
    const { fn } = fakeFetch(() => json({ error: 'Your account has run out of searches.' }, 429));

    const error = await new SerpApiFlightsClient({ apiKey: KEY, fetch: fn }).buscarVuelos(criteria).catch((e) => e);

    expect(error.message).toBe('HTTP 429: Your account has run out of searches.');
    expect(error.message).not.toContain(KEY);
  });

  it('un fallo de red se lanza sin exponer la api_key', async () => {
    const failing = (async () => {
      throw Object.assign(new Error(`connect ECONNREFUSED https://serpapi.com/search.json?api_key=${KEY}`), { name: 'TypeError' });
    }) as unknown as typeof fetch;

    const error = await new SerpApiFlightsClient({ apiKey: KEY, fetch: failing }).buscarVuelos(criteria).catch((e) => e);

    expect(error.message).toBe('request failed (TypeError)');
    expect(error.message).not.toContain(KEY);
  });

  it('exige apiKey', () => {
    expect(() => new SerpApiFlightsClient({ apiKey: '' })).toThrow(/apiKey/);
  });

  it('la reserva es simulada: siempre se confirma con un código SIM-', async () => {
    const client = new SerpApiFlightsClient({ apiKey: KEY });

    const result = await client.reservarVuelo({ flightNumber: 'AA 787', departureDate: '2026-10-10', passengers: 1, reference: 'booking-42' });

    expect(result).toEqual({ pnr: 'SIM-FL-BOOKING42', ticketNumber: 'SIM-FL-BOOKING42-T', status: 'CONFIRMED' });
  });
});
