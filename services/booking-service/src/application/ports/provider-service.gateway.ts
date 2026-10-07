import { BookingItemType } from '../../domain/value-objects/booking-item-type';

// Puerto hacia provider-service (Dev 3), que a su vez usa sus Adapters
// para hablar con las APIs externas de transporte y alojamiento.

export interface ProviderReservationRequest {
  bookingId: string;
  items: Array<{
    type: BookingItemType;
    providerId: string;
    offerId: string;
    quantity: number;
  }>;
}

export type ProviderReservationResult =
  | { available: true; reservationCode: string }
  | { available: false; reason: string };

export interface ProviderServiceGateway {
  // Verifica disponibilidad y bloquea los cupos. Devuelve available=false si el
  // proveedor no tiene cupo; lanza una excepción si el servicio falla.
  reserve(request: ProviderReservationRequest, correlationId: string): Promise<ProviderReservationResult>;
}