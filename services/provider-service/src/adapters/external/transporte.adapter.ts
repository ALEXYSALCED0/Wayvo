import {
  ConfirmacionResultado,
  DisponibilidadQuery,
  DisponibilidadResultado,
  IProveedorExterno,
  ReservaDatos,
} from '../../application/ports/proveedor-externo.port';
import { callExternal } from './call-external';
import { AdapterMappingError } from './errors';
import { optionalString, requireString } from './metadata';
import { FlightSearchCriteria, TransporteAPIExterna } from './transporte-api-externa';

const PROVIDER = 'transporte';
const CABIN_CLASSES = ['economy', 'business', 'first'] as const;

// "AA 787" y "aa787" son el mismo vuelo
const normalizeFlightNumber = (value: string) => value.replace(/\s+/g, '').toUpperCase();

interface FlightRef {
  originAirport: string;
  destinationAirport: string;
  departureDate: string;
  flightNumber: string;
  cabinClass?: FlightSearchCriteria['cabinClass'];
}

// ADAPTER para que parezca un IProveedorExterno.
// ProviderService pide "consultarDisponibilidad / confirmarReserva" y lo traduce a "buscarVuelos / reservarVuelo"
// La oferta (ServiceOffer) representa un vuelo concreto
export class TransporteAdapter implements IProveedorExterno {
  constructor(private readonly api: TransporteAPIExterna) {}

  async consultarDisponibilidad(criterios: DisponibilidadQuery): Promise<DisponibilidadResultado> {
    const ref = this.readRef(criterios.metadata, criterios.offerId, criterios.date);

    const flights = await callExternal(PROVIDER, 'buscarVuelos', () =>
      this.api.buscarVuelos({
        originAirport: ref.originAirport,
        destinationAirport: ref.destinationAirport,
        departureDate: ref.departureDate,
        passengers: criterios.quantity,
        cabinClass: ref.cabinClass,
      }),
    );

    // La API devuelve todos los vuelos, se queda el de la oferta
    const wanted = normalizeFlightNumber(ref.flightNumber);
    const flight = flights.find((f) => normalizeFlightNumber(f.flightNumber) === wanted);
    if (!flight) {
      return {
        available: false,
        remainingUnits: 0,
        reason: `Flight ${ref.flightNumber} not found for ${ref.originAirport}-${ref.destinationAirport} on ${ref.departureDate}`,
      };
    }

    if (flight.seatsAvailable !== undefined && flight.seatsAvailable < criterios.quantity) {
      return {
        available: false,
        remainingUnits: flight.seatsAvailable,
        unitPrice: flight.pricePerSeat,
        reason: `Only ${flight.seatsAvailable} seats left on flight ${flight.flightNumber}, requested ${criterios.quantity}`,
      };
    }
    return { available: true, remainingUnits: flight.seatsAvailable, unitPrice: flight.pricePerSeat };
  }

  async confirmarReserva(datos: ReservaDatos): Promise<ConfirmacionResultado> {
    const ref = this.readRef(datos.metadata, datos.offerId);

    const result = await callExternal(PROVIDER, 'reservarVuelo', () =>
      this.api.reservarVuelo({
        flightNumber: ref.flightNumber,
        departureDate: ref.departureDate,
        passengers: datos.quantity,
        passengerName: datos.customerName,
        passengerEmail: datos.customerEmail,
        reference: datos.bookingId,
      }),
    );

    if (result.status !== 'CONFIRMED') {
      return { success: false, reason: result.reason ?? `Flight booking rejected by the provider` };
    }
    return { success: true, reservationCode: result.pnr, confirmationCode: result.ticketNumber };
  }

  private readRef(metadata: Record<string, unknown> | undefined, offerId: string, date?: string): FlightRef {
    const cabin = optionalString(metadata, 'cabinClass', offerId);
    if (cabin !== undefined && !(CABIN_CLASSES as readonly string[]).includes(cabin)) {
      throw new AdapterMappingError(`Offer ${offerId} has an invalid metadata.cabinClass`);
    }
    return {
      originAirport: requireString(metadata, 'originAirport', offerId),
      destinationAirport: requireString(metadata, 'destinationAirport', offerId),
      departureDate: requireString(metadata, 'departureDate', offerId, date),
      flightNumber: requireString(metadata, 'flightNumber', offerId),
      cabinClass: cabin as FlightRef['cabinClass'],
    };
  }
}
