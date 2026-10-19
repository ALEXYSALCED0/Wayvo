// ADAPTEE del TransporteAdapter: la API de vuelos de https://serpapi.com/search?engine=google_flights
// Los tipos de búsqueda replican los de @wayvo/contracts (external-adapter.dto.ts).

export interface FlightSearchCriteria {
  originAirport: string;
  destinationAirport: string;
  departureDate: string;
  passengers: number;
  cabinClass?: 'economy' | 'business' | 'first';
}

export interface ExternalFlightResult {
  flightNumber: string;
  airline: string;
  // No informa de asientos libres, se considera disponible mientras aparezca en la búsqueda
  seatsAvailable?: number;
  pricePerSeat: number;
  departureIso: string;
  arrivalIso: string;
}

export interface FlightBookingRequest {
  flightNumber: string;
  departureDate: string;
  passengers: number;
  passengerName?: string;
  passengerEmail?: string;
  reference: string; // para poder rastrear la reserva en el proveedor
}

export interface FlightBookingResult {
  pnr: string;
  ticketNumber?: string;
  status: 'CONFIRMED' | 'REJECTED';
  reason?: string;
}

export interface TransporteAPIExterna {
  buscarVuelos(criterios: FlightSearchCriteria): Promise<ExternalFlightResult[]>;
  reservarVuelo(datos: FlightBookingRequest): Promise<FlightBookingResult>;
}
