import { FlightSearchCriteria } from '../../adapters/external/transporte-api-externa';

// Catálogo e inventario del proveedor falso, mismos resultados

// Vuelos: cada ruta tiene 3 vuelos consecutivos "WYnnn" (mañana 30 asientos, tarde 8, noche 2).
//         flightNumbersFor('BAQ', 'CTG') da los tres números de esa ruta.
// Hoteles: cada ciudad tiene 3 hoteles "HTL-<CIU>-1..3" (12, 5 y 1 habitaciones),
//         "Madrid" -> HTL-MAD-1, "CTG" -> HTL-CTG-1.

export interface MockFlight {
  flightNumber: string;
  airline: string;
  seatsAvailable: number;
  pricePerSeat: number;
  departureIso: string;
  arrivalIso: string;
}

export interface MockHotel {
  hotelCode: string;
  hotelName: string;
  roomsAvailable: number;
  nightlyRate: number;
}

export type MockBookingResult =
  | { status: 'CONFIRMED'; code: string; ticketNumber?: string }
  | { status: 'REJECTED'; reason: string };

const FLIGHT_SEATS = [30, 8, 2];
const FLIGHT_DEPARTURES = ['06:30', '13:00', '19:45'];
const FLIGHT_PRICE_FACTORS = [1, 1.15, 0.9];
const CABIN_FACTORS = { economy: 1, business: 2.2, first: 3.5 } as const;
const FLIGHT_DURATION_MINUTES = 90;
const HOTEL_ROOMS = [12, 5, 1];
const HOTEL_NAMES = (city: string) => [`Hotel ${city} Plaza`, `${city} Boutique Inn`, `Gran Hotel ${city}`];
const HOTEL_RATE_FACTORS = [1, 1.4, 0.8];

const FLIGHT_NUMBER = /^WY(\d{3})$/;
const HOTEL_CODE = /^HTL-[A-Z]{3}-([1-3])$/;

function hash(text: string): number {
  let h = 5381;
  for (const char of text.toUpperCase()) h = ((h << 5) + h + char.charCodeAt(0)) >>> 0;
  return h;
}

const roundThousands = (value: number) => Math.round(value / 1000) * 1000;

export function flightNumbersFor(origin: string, destination: string): string[] {
  const base = 100 + 3 * (hash(`${origin.toUpperCase()}>${destination.toUpperCase()}`) % 300);
  return [0, 1, 2].map((i) => `WY${base + i}`);
}

export function hotelCodesFor(city: string): string[] {
  const letters = city.normalize('NFD').replace(/[^A-Za-z]/g, '').toUpperCase().padEnd(3, 'X').slice(0, 3);
  return [1, 2, 3].map((i) => `HTL-${letters}-${i}`);
}

const titleCase = (text: string) => text.trim().charAt(0).toUpperCase() + text.trim().slice(1);

function addMinutes(date: string, time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const hh = String(Math.floor(total / 60) % 24).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${date}T${hh}:${mm}:00`;
}

export class MockInventory {
  private flightStock = new Map<string, number>();
  private roomStock = new Map<string, number>();
  private bookingCounter = 0;

  reset(): void {
    this.flightStock.clear();
    this.roomStock.clear();
    this.bookingCounter = 0;
  }

  flights(criteria: Pick<FlightSearchCriteria, 'originAirport' | 'destinationAirport' | 'departureDate'> & {
    cabinClass?: keyof typeof CABIN_FACTORS;
  }): MockFlight[] {
    const { originAirport, destinationAirport, departureDate, cabinClass = 'economy' } = criteria;
    const route = `${originAirport.toUpperCase()}>${destinationAirport.toUpperCase()}`;
    const basePrice = 150_000 + (hash(route) % 30) * 10_000;

    return flightNumbersFor(originAirport, destinationAirport).map((flightNumber, i) => ({
      flightNumber,
      airline: 'Wayvo Air',
      seatsAvailable: this.remainingSeats(flightNumber, departureDate),
      pricePerSeat: roundThousands(basePrice * FLIGHT_PRICE_FACTORS[i] * CABIN_FACTORS[cabinClass]),
      departureIso: `${departureDate}T${FLIGHT_DEPARTURES[i]}:00`,
      arrivalIso: addMinutes(departureDate, FLIGHT_DEPARTURES[i], FLIGHT_DURATION_MINUTES),
    }));
  }

  bookFlight(flightNumber: string, departureDate: string, passengers: number): MockBookingResult {
    if (!FLIGHT_NUMBER.test(flightNumber)) {
      return { status: 'REJECTED', reason: `Flight ${flightNumber} not found` };
    }
    const remaining = this.remainingSeats(flightNumber, departureDate);
    if (remaining < passengers) {
      return { status: 'REJECTED', reason: `Only ${remaining} seats left on flight ${flightNumber}, requested ${passengers}` };
    }
    this.flightStock.set(`${flightNumber}|${departureDate}`, remaining - passengers);
    const n = this.nextBookingNumber();
    return { status: 'CONFIRMED', code: `MOCK-FL-${n}`, ticketNumber: `MOCK-TK-${n}` };
  }

  hotels(city: string, checkInDate: string, checkOutDate: string): MockHotel[] {
    const name = titleCase(city);
    const baseRate = 180_000 + (hash(city) % 20) * 10_000;
    const names = HOTEL_NAMES(name);

    return hotelCodesFor(city).map((hotelCode, i) => ({
      hotelCode,
      hotelName: names[i],
      roomsAvailable: this.remainingRooms(hotelCode, checkInDate, checkOutDate),
      nightlyRate: roundThousands(baseRate * HOTEL_RATE_FACTORS[i]),
    }));
  }

  bookRoom(hotelCode: string, checkInDate: string, checkOutDate: string, rooms: number): MockBookingResult {
    if (!HOTEL_CODE.test(hotelCode)) {
      return { status: 'REJECTED', reason: `Hotel ${hotelCode} not found` };
    }
    const remaining = this.remainingRooms(hotelCode, checkInDate, checkOutDate);
    if (remaining < rooms) {
      return { status: 'REJECTED', reason: `Only ${remaining} rooms left at ${hotelCode}, requested ${rooms}` };
    }
    this.roomStock.set(`${hotelCode}|${checkInDate}|${checkOutDate}`, remaining - rooms);
    return { status: 'CONFIRMED', code: `MOCK-HT-${this.nextBookingNumber()}` };
  }

  private remainingSeats(flightNumber: string, date: string): number {
    const key = `${flightNumber}|${date}`;
    const stored = this.flightStock.get(key);
    if (stored !== undefined) return stored;
    const match = FLIGHT_NUMBER.exec(flightNumber);
    return match ? FLIGHT_SEATS[(Number(match[1]) - 100) % 3] : 0;
  }

  private remainingRooms(hotelCode: string, checkIn: string, checkOut: string): number {
    const key = `${hotelCode}|${checkIn}|${checkOut}`;
    const stored = this.roomStock.get(key);
    if (stored !== undefined) return stored;
    const match = HOTEL_CODE.exec(hotelCode);
    return match ? HOTEL_ROOMS[Number(match[1]) - 1] : 0;
  }

  private nextBookingNumber(): string {
    this.bookingCounter += 1;
    return String(this.bookingCounter).padStart(4, '0');
  }
}
