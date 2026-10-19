import {
  AlojamientoAPIExterna,
  ExternalHotelResult,
  HotelSearchCriteria,
  RoomBookingRequest,
  RoomBookingResult,
} from '../../adapters/external/alojamiento-api-externa';
import { getJson, HttpOptions } from './http';
import { simulateRoomBooking } from './simulated-booking';

// Cliente de hotels-api.com (v2): el ADAPTEE real de AlojamientoAdapter.

//  Da id, nombre, ciudad, país, estrellas y servicios del hotel.
//  NO da habitaciones libres, tarifas ni fechas.
//  Busca por NOMBRE de ciudad

export interface HotelsApiConfig extends HttpOptions {
  apiKey: string;
  baseUrl?: string;
  limit?: number;
}

const DEFAULT_BASE_URL = 'https://api.hotels-api.com/v2';
const DEFAULT_LIMIT = 20;

interface HotelsApiHotel { id?: number | string; name?: string }
interface HotelsApiResponse { success?: boolean; data?: HotelsApiHotel[]; message?: string | null }

export class HotelsApiClient implements AlojamientoAPIExterna {
  private readonly baseUrl: string;
  private readonly limit: number;

  constructor(private readonly config: HotelsApiConfig) {
    if (!config.apiKey) throw new Error('hotels-api apiKey is required');
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.limit = config.limit ?? DEFAULT_LIMIT;
  }

  async buscarHoteles(criterios: HotelSearchCriteria): Promise<ExternalHotelResult[]> {
    const params = new URLSearchParams({ city: criterios.cityCode, limit: String(this.limit) });

    const body = (await getJson(
      `${this.baseUrl}/hotels/search?${params}`,
      { 'X-API-KEY': this.config.apiKey },
      this.config,
    )) as HotelsApiResponse;

    if (!body?.success) {
      throw new Error(body?.message ?? 'hotels-api reported an unsuccessful response');
    }

    return (body.data ?? []).flatMap((hotel) =>
      hotel.id === undefined || !hotel.name
        ? []
        : [{ hotelCode: String(hotel.id), hotelName: hotel.name }],
    );
  }

  async reservarHabitacion(datos: RoomBookingRequest): Promise<RoomBookingResult> {
    return simulateRoomBooking(datos);
  }
}
