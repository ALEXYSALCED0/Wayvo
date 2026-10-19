// ADAPTEE del AlojamientoAdapter: API de hoteles o alquileres de un tercero https://api.hotels-api.com/v2
// Los tipos de búsqueda replican los de @wayvo/contracts (external-adapter.dto.ts)

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
  // Algunos solo entregan el catálogo, sin habitaciones libres ni tarifas,
  // el hotel se considera disponible si aparece en la búsqueda
  roomsAvailable?: number;
  nightlyRate?: number;
}

export interface RoomBookingRequest {
  hotelCode: string;
  roomType?: string;
  checkInDate: string;
  checkOutDate: string;
  rooms: number;
  guestName?: string;
  guestEmail?: string;
  reference: string;   // referencia nuestra (bookingId) para rastrear la reserva en el proveedor
}

export interface RoomBookingResult {
  bookingRef: string;
  status: 'CONFIRMED' | 'REJECTED';
  reason?: string;
}

export interface AlojamientoAPIExterna {
  buscarHoteles(criterios: HotelSearchCriteria): Promise<ExternalHotelResult[]>;
  reservarHabitacion(datos: RoomBookingRequest): Promise<RoomBookingResult>;
}
