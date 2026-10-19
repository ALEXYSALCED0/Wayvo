import {
  ExternalFlightResult,
  FlightBookingRequest,
  FlightBookingResult,
  FlightSearchCriteria,
  TransporteAPIExterna,
} from '../../adapters/external/transporte-api-externa';
import { getJson, HttpOptions } from './http';
import { simulateFlightBooking } from './simulated-booking';

// Cliente de SerpApi (engine google_flights): el ADAPTEE real de TransporteAdapter.

//  Da itinerarios (con sus tramos), horarios y precio. Un itinerario con escalas es UN resultado
//    cuyo flightNumber junta los de sus tramos: "AA 787 + AA 1457".
//  No da asientos libres (seatsAvailable queda sin definir) y no reserva
//  Si no hay vuelos, responde { error: "...hasn't returned any results..." }

export interface SerpApiFlightsConfig extends HttpOptions {
  apiKey: string;
  baseUrl?: string;
  currency?: string;
}

const DEFAULT_BASE_URL = 'https://serpapi.com/search.json';
// travel_class de SerpApi: 1 economy, 2 premium economy, 3 business, 4 first
const TRAVEL_CLASS = { economy: '1', business: '3', first: '4' } as const;
const NO_RESULTS = /hasn't returned any results|no results/i;

interface SerpAirport { id?: string; time?: string }
interface SerpLeg {
  departure_airport?: SerpAirport;
  arrival_airport?: SerpAirport;
  airline?: string;
  flight_number?: string;
}
interface SerpItinerary { flights?: SerpLeg[]; price?: number }
interface SerpResponse {
  error?: string;
  best_flights?: SerpItinerary[];
  other_flights?: SerpItinerary[];
}

export class SerpApiFlightsClient implements TransporteAPIExterna {
  private readonly baseUrl: string;
  private readonly currency: string;

  constructor(private readonly config: SerpApiFlightsConfig) {
    if (!config.apiKey) throw new Error('SerpApi apiKey is required');
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.currency = config.currency ?? 'COP';
  }

  async buscarVuelos(criterios: FlightSearchCriteria): Promise<ExternalFlightResult[]> {
    const params = new URLSearchParams({
      engine: 'google_flights',
      departure_id: criterios.originAirport,
      arrival_id: criterios.destinationAirport,
      outbound_date: criterios.departureDate,
      type: '2', // solo ida
      adults: String(criterios.passengers),
      currency: this.currency,
      hl: 'en',
      api_key: this.config.apiKey,
    });
    if (criterios.cabinClass) params.set('travel_class', TRAVEL_CLASS[criterios.cabinClass]);

    const body = (await getJson(`${this.baseUrl}?${params}`, {}, this.config)) as SerpResponse;

    if (body?.error) {
      if (NO_RESULTS.test(body.error)) return [];
      throw new Error(body.error);
    }

    const itineraries = [...(body?.best_flights ?? []), ...(body?.other_flights ?? [])];
    return itineraries.flatMap((itinerary) => this.toFlight(itinerary));
  }

  async reservarVuelo(datos: FlightBookingRequest): Promise<FlightBookingResult> {
    return simulateFlightBooking(datos);
  }

  private toFlight(itinerary: SerpItinerary): ExternalFlightResult[] {
    const legs = itinerary.flights ?? [];
    const first = legs[0];
    const last = legs[legs.length - 1];
    // Sin tramos, sin número de vuelo o sin precio no hay nada que ofrecer
    if (!first || !last || typeof itinerary.price !== 'number') return [];
    if (legs.some((leg) => !leg.flight_number)) return [];

    const airlines = [...new Set(legs.map((leg) => leg.airline).filter((a): a is string => !!a))];
    return [
      {
        flightNumber: legs.map((leg) => leg.flight_number).join(' + '),
        airline: airlines.join(' / '),
        pricePerSeat: itinerary.price,
        departureIso: toIsoLocal(first.departure_airport?.time),
        arrivalIso: toIsoLocal(last.arrival_airport?.time),
      },
    ];
  }
}

// SerpApi da la hora local del aeropuerto como "2026-10-10 12:15": se pasa a "2026-10-10T12:15:00"
function toIsoLocal(time: string | undefined): string {
  if (!time) return '';
  const match = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})$/.exec(time);
  return match ? `${match[1]}T${match[2]}:00` : time;
}
