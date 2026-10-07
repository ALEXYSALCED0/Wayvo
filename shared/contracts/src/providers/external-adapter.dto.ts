/**
 * Target Interface Contracts for Adapter Pattern (GoF Structural)
 * Implemented by Provider Adapters to normalize heterogeneous 3rd-party APIs.
 */

export interface DisponibilidadQuery {
  offerId: string;
  date?: string;
  quantity: number;
  metadata?: Record<string, unknown>;
}

export interface DisponibilidadResultado {
  available: boolean;
  remainingUnits?: number;
  unitPrice?: number;
  reason?: string;
}

export interface ReservaDatos {
  bookingId: string;
  offerId: string;
  quantity: number;
  customerName?: string;
  customerEmail?: string;
  metadata?: Record<string, unknown>;
}

export interface ConfirmacionResultado {
  success: boolean;
  confirmationCode?: string;
  reservationCode?: string;
  reason?: string;
  expiresAt?: string;
}

/**
 * Common Target Interface for external provider adapters
 */
export interface IProveedorExterno {
  consultarDisponibilidad(criterios: DisponibilidadQuery): Promise<DisponibilidadResultado>;
  confirmarReserva(datos: ReservaDatos): Promise<ConfirmacionResultado>;
}

/**
 * 3rd-Party Flight/Transit API Data Structures (TransporteAdapter)
 */
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
  seatsAvailable: number;
  pricePerSeat: number;
  departureIso: string;
  arrivalIso: string;
}

/**
 * 3rd-Party Lodging API Data Structures (AlojamientoAdapter)
 */
export interface HotelSearchCriteria {
  cityCode: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  roomType?: string;
}

export interface ExternalHotelResult {
  hotelCode: string;
  hotelName: string;
  roomsAvailable: number;
  nightlyRate: number;
}
