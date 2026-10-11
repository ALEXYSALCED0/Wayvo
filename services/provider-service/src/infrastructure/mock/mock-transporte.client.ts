import {
  ExternalFlightResult,
  FlightBookingRequest,
  FlightBookingResult,
  FlightSearchCriteria,
  TransporteAPIExterna,
} from '../../adapters/external/transporte-api-externa';
import { getJson, HttpOptions, postJson } from '../external/http';

// ADAPTEE de TransporteAdapter en mock habla por HTTP con /external/flights del simulador,
// igual que SerpApiFlightsClient lo hace con SerpApi, sin API key

export interface MockTransporteConfig extends HttpOptions {
  baseUrl: string; // p. ej. http://localhost:3002/api/v1/mock/external
}

export class MockTransporteClient implements TransporteAPIExterna {
  constructor(private readonly config: MockTransporteConfig) {}

  async buscarVuelos(criterios: FlightSearchCriteria): Promise<ExternalFlightResult[]> {
    const params = new URLSearchParams({
      originAirport: criterios.originAirport,
      destinationAirport: criterios.destinationAirport,
      departureDate: criterios.departureDate,
      passengers: String(criterios.passengers),
    });
    if (criterios.cabinClass) params.set('cabinClass', criterios.cabinClass);

    const body = (await getJson(`${this.config.baseUrl}/flights/search?${params}`, {}, this.config)) as {
      flights?: ExternalFlightResult[];
    };
    return body?.flights ?? [];
  }

  async reservarVuelo(datos: FlightBookingRequest): Promise<FlightBookingResult> {
    const body = (await postJson(`${this.config.baseUrl}/flights/book`, datos, {}, this.config)) as FlightBookingResult;
    return body.status === 'CONFIRMED'
      ? { pnr: body.pnr, ...(body.ticketNumber && { ticketNumber: body.ticketNumber }), status: 'CONFIRMED' }
      : { pnr: '', status: 'REJECTED', reason: body.reason };
  }
}
