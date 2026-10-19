import {
  AlojamientoAPIExterna,
  ExternalHotelResult,
  HotelSearchCriteria,
  RoomBookingRequest,
  RoomBookingResult,
} from '../../adapters/external/alojamiento-api-externa';
import { getJson, HttpOptions, postJson } from '../external/http';

// ADAPTEE de AlojamientoAdapter en mock habla por HTTP con /external/hotels del simulador,
// igual que HotelsApiClient lo hace con hotels-api.com, sin API key

export interface MockAlojamientoConfig extends HttpOptions {
  baseUrl: string;
}

export class MockAlojamientoClient implements AlojamientoAPIExterna {
  constructor(private readonly config: MockAlojamientoConfig) {}

  async buscarHoteles(criterios: HotelSearchCriteria): Promise<ExternalHotelResult[]> {
    const params = new URLSearchParams({
      cityCode: criterios.cityCode,
      checkInDate: criterios.checkInDate,
      checkOutDate: criterios.checkOutDate,
      guests: String(criterios.guests),
    });
    if (criterios.roomType) params.set('roomType', criterios.roomType);

    const body = (await getJson(`${this.config.baseUrl}/hotels/search?${params}`, {}, this.config)) as {
      hotels?: ExternalHotelResult[];
    };
    return body?.hotels ?? [];
  }

  async reservarHabitacion(datos: RoomBookingRequest): Promise<RoomBookingResult> {
    const body = (await postJson(`${this.config.baseUrl}/hotels/book`, datos, {}, this.config)) as RoomBookingResult;
    return body.status === 'CONFIRMED'
      ? { bookingRef: body.bookingRef, status: 'CONFIRMED' }
      : { bookingRef: '', status: 'REJECTED', reason: body.reason };
  }
}
