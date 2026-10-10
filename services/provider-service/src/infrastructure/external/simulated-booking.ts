import { FlightBookingRequest, FlightBookingResult } from '../../adapters/external/transporte-api-externa';
import { RoomBookingRequest, RoomBookingResult } from '../../adapters/external/alojamiento-api-externa';

// SerpApi y hotels-api.com son de búsqueda - catálogo, las reservas se simulan y el código lleva el prefijo SIM-
// El servidor mock con simulate-failure podrá reemplazar esto para demostrar fallos del proveedor

const codeFor = (kind: 'FL' | 'HT', reference: string) =>
  `SIM-${kind}-${reference.replace(/[^A-Za-z0-9]/g, '').slice(0, 12).toUpperCase()}`;

export function simulateFlightBooking(datos: FlightBookingRequest): FlightBookingResult {
  const code = codeFor('FL', datos.reference);
  return { pnr: code, ticketNumber: `${code}-T`, status: 'CONFIRMED' };
}

export function simulateRoomBooking(datos: RoomBookingRequest): RoomBookingResult {
  return { bookingRef: codeFor('HT', datos.reference), status: 'CONFIRMED' };
}
