import {
  AlojamientoAPIExterna,
  ExternalHotelResult,
  HotelSearchCriteria,
  RoomBookingRequest,
  RoomBookingResult,
} from '../../../src/adapters/external/alojamiento-api-externa';
import {
  ExternalFlightResult,
  FlightBookingRequest,
  FlightBookingResult,
  FlightSearchCriteria,
  TransporteAPIExterna,
} from '../../../src/adapters/external/transporte-api-externa';

// APIs externas de mentira que registran lo que reciben y responden lo que cada test configure.

export class FakeTransporteApi implements TransporteAPIExterna {
  searches: FlightSearchCriteria[] = [];
  bookings: FlightBookingRequest[] = [];
  flights: ExternalFlightResult[] = [flight()];
  bookingResult: FlightBookingResult = { pnr: 'PNR123', ticketNumber: 'TKT456', status: 'CONFIRMED' };
  failWith: Error | null = null;

  async buscarVuelos(criterios: FlightSearchCriteria): Promise<ExternalFlightResult[]> {
    this.searches.push(criterios);
    if (this.failWith) throw this.failWith;
    return this.flights;
  }

  async reservarVuelo(datos: FlightBookingRequest): Promise<FlightBookingResult> {
    this.bookings.push(datos);
    if (this.failWith) throw this.failWith;
    return this.bookingResult;
  }
}

export class FakeAlojamientoApi implements AlojamientoAPIExterna {
  searches: HotelSearchCriteria[] = [];
  bookings: RoomBookingRequest[] = [];
  hotels: ExternalHotelResult[] = [hotel()];
  bookingResult: RoomBookingResult = { bookingRef: 'HTL789', status: 'CONFIRMED' };
  failWith: Error | null = null;

  async buscarHoteles(criterios: HotelSearchCriteria): Promise<ExternalHotelResult[]> {
    this.searches.push(criterios);
    if (this.failWith) throw this.failWith;
    return this.hotels;
  }

  async reservarHabitacion(datos: RoomBookingRequest): Promise<RoomBookingResult> {
    this.bookings.push(datos);
    if (this.failWith) throw this.failWith;
    return this.bookingResult;
  }
}

export function flight(overrides: Partial<ExternalFlightResult> = {}): ExternalFlightResult {
  return {
    flightNumber: 'AV123',
    airline: 'Avianca',
    seatsAvailable: 20,
    pricePerSeat: 320000,
    departureIso: '2026-12-01T08:00:00Z',
    arrivalIso: '2026-12-01T09:30:00Z',
    ...overrides,
  };
}

export function hotel(overrides: Partial<ExternalHotelResult> = {}): ExternalHotelResult {
  return { hotelCode: 'HTL-CTG-1', hotelName: 'Hotel Caribe', roomsAvailable: 5, nightlyRate: 280000, ...overrides };
}

// Metadata que llevaría una oferta de vuelo u hotel
export const flightMetadata = {
  originAirport: 'BAQ',
  destinationAirport: 'CTG',
  departureDate: '2026-12-01',
  flightNumber: 'AV123',
};

export const stayMetadata = {
  cityCode: 'CTG',
  hotelCode: 'HTL-CTG-1',
  checkInDate: '2026-12-01',
  checkOutDate: '2026-12-03',
  roomType: 'double',
};
