import { MockBookingResult, MockFlight, MockHotel, MockInventory } from './mock-inventory';
import { MockSimulationState } from './simulation-state';

// El proveedor externo falso aplica el modo activo del simulador a cada llamada
//   normal       responde con un retardo entre latency.minMs y latency.maxMs
//   unavailable  búsquedas con 0 disponibles
//   slow         espera delayMs antes de responder
//   error        lanza MockProviderOutageError (el router lo responde como HTTP 503)

export class MockProviderOutageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MockProviderOutageError';
  }
}

export interface MockExternalApiOptions {
  latency?: { minMs: number; maxMs: number };
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
}

const DEFAULT_LATENCY = { minMs: 150, maxMs: 600 };
const UNAVAILABLE_REASON = 'Provider reports no availability (simulated)';

export class MockExternalApi {
  private readonly latency: { minMs: number; maxMs: number };
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly random: () => number;

  constructor(
    private readonly state: MockSimulationState,
    private readonly inventory: MockInventory = new MockInventory(),
    options: MockExternalApiOptions = {},
  ) {
    this.latency = options.latency ?? DEFAULT_LATENCY;
    this.sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    this.random = options.random ?? Math.random;
  }

  async searchFlights(criteria: Parameters<MockInventory['flights']>[0]): Promise<MockFlight[]> {
    const unavailable = await this.gate();
    const flights = this.inventory.flights(criteria);
    return unavailable ? flights.map((f) => ({ ...f, seatsAvailable: 0 })) : flights;
  }

  async bookFlight(flightNumber: string, departureDate: string, passengers: number): Promise<MockBookingResult> {
    if (await this.gate()) return this.rejection();
    return this.inventory.bookFlight(flightNumber, departureDate, passengers);
  }

  async searchHotels(city: string, checkInDate: string, checkOutDate: string): Promise<MockHotel[]> {
    const unavailable = await this.gate();
    const hotels = this.inventory.hotels(city, checkInDate, checkOutDate);
    return unavailable ? hotels.map((h) => ({ ...h, roomsAvailable: 0 })) : hotels;
  }

  async bookRoom(hotelCode: string, checkIn: string, checkOut: string, rooms: number): Promise<MockBookingResult> {
    if (await this.gate()) return this.rejection();
    return this.inventory.bookRoom(hotelCode, checkIn, checkOut, rooms);
  }

  resetInventory(): void {
    this.inventory.reset();
  }

  // Aplica el modo activo. Devuelve true si el proveedor debe comportarse como "sin disponibilidad".
  private async gate(): Promise<boolean> {
    const { activeMode, delayMs, failureReason } = this.state.status();
    if (activeMode === 'slow') {
      await this.sleep(delayMs);
    } else {
      const { minMs, maxMs } = this.latency;
      await this.sleep(minMs + this.random() * (maxMs - minMs));
    }
    if (activeMode === 'error') {
      throw new MockProviderOutageError(failureReason ?? 'Simulated provider outage');
    }
    return activeMode === 'unavailable';
  }

  private rejection(): MockBookingResult {
    return { status: 'REJECTED', reason: this.state.status().failureReason ?? UNAVAILABLE_REASON };
  }
}
