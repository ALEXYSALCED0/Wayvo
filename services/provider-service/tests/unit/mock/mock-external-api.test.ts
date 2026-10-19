import { describe, expect, it } from 'vitest';
import { MockExternalApi, MockProviderOutageError } from '../../../src/infrastructure/mock/mock-external-api';
import { flightNumbersFor, hotelCodesFor, MockInventory } from '../../../src/infrastructure/mock/mock-inventory';
import { MockSimulationState } from '../../../src/infrastructure/mock/simulation-state';

function build() {
  const sleeps: number[] = [];
  const state = new MockSimulationState();
  const api = new MockExternalApi(state, new MockInventory(), {
    sleep: async (ms) => { sleeps.push(ms); },
    random: () => 0,
  });
  return { api, state, sleeps };
}
const route = { originAirport: 'BAQ', destinationAirport: 'CTG', departureDate: '2026-12-01' };

describe('MockInventory', () => {
  it('es determinista', () => {
    expect(flightNumbersFor('baq', 'ctg')).toEqual(flightNumbersFor('BAQ', 'CTG'));
    expect(flightNumbersFor('BAQ', 'CTG')).toHaveLength(3);
    expect(hotelCodesFor('Madrid')).toEqual(['HTL-MAD-1', 'HTL-MAD-2', 'HTL-MAD-3']);
  });

  it('reservar descuenta cupo y al agotarse rechaza', () => {
    const inv = new MockInventory();
    const [, , last] = flightNumbersFor('BAQ', 'CTG'); // 2 asientos
    expect(inv.bookFlight(last, '2026-12-01', 2).status).toBe('CONFIRMED');
    expect(inv.bookFlight(last, '2026-12-01', 1)).toMatchObject({ status: 'REJECTED' });
    expect(inv.flights(route)[2].seatsAvailable).toBe(0);
    inv.reset();
    expect(inv.flights(route)[2].seatsAvailable).toBe(2);
  });

  it('rechaza vuelos y hoteles que no existen', () => {
    const inv = new MockInventory();
    expect(inv.bookFlight('XX1', '2026-12-01', 1).status).toBe('REJECTED');
    expect(inv.bookRoom('nope', '2026-12-01', '2026-12-02', 1).status).toBe('REJECTED');
  });

  it('la clase de cabina encarece el vuelo', () => {
    const inv = new MockInventory();
    const eco = inv.flights(route)[0].pricePerSeat;
    const biz = inv.flights({ ...route, cabinClass: 'business' })[0].pricePerSeat;
    expect(biz).toBeGreaterThan(eco);
  });
});

describe('MockExternalApi', () => {
  it('normal: responde con latencia dentro del rango', async () => {
    const { api, sleeps } = build();
    const flights = await api.searchFlights(route);
    expect(flights.every((f) => f.seatsAvailable > 0)).toBe(true);
    expect(sleeps).toEqual([150]);
  });

  it('unavailable: búsquedas en cero y reservas rechazadas con el motivo configurado', async () => {
    const { api, state } = build();
    state.update({ mode: 'unavailable', failureReason: 'Overbooked' });
    expect((await api.searchFlights(route)).every((f) => f.seatsAvailable === 0)).toBe(true);
    expect((await api.searchHotels('Madrid', '2026-12-01', '2026-12-03')).every((h) => h.roomsAvailable === 0)).toBe(true);
    expect(await api.bookFlight(flightNumbersFor('BAQ', 'CTG')[0], '2026-12-01', 1)).toEqual({
      status: 'REJECTED', reason: 'Overbooked',
    });
  });

  it('slow: espera el retardo configurado', async () => {
    const { api, state, sleeps } = build();
    state.update({ mode: 'slow', delayMs: 7000 });
    await api.searchHotels('Madrid', '2026-12-01', '2026-12-03');
    expect(sleeps).toEqual([7000]);
  });

  it('error: lanza una caída del proveedor', async () => {
    const { api, state } = build();
    state.update({ mode: 'error' });
    await expect(api.searchFlights(route)).rejects.toThrow(MockProviderOutageError);
    await expect(api.bookRoom('HTL-MAD-1', '2026-12-01', '2026-12-02', 1)).rejects.toThrow(MockProviderOutageError);
  });
});
