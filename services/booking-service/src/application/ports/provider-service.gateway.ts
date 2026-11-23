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
    metadata?: Record<string, unknown>;
  }>;
}

export type ProviderReservationResult =
  | { available: true; reservationCode: string }
  | { available: false; reason: string };

export interface ProviderReleaseRequest {
  bookingId: string;
  items: Array<{ offerId: string; quantity: number }>;
}

export interface ProviderServiceGateway {
  // Verifica disponibilidad y bloquea los cupos. Devuelve available=false si el
  // proveedor no tiene cupo; lanza una excepción si el servicio falla.
  reserve(request: ProviderReservationRequest, correlationId: string): Promise<ProviderReservationResult>;

  // Compensación de reserve(): devuelve los cupos apartados. Lanza una excepción
  // si algún cupo no se pudo devolver, para que la Saga lo deje en el log.
  release(request: ProviderReleaseRequest, correlationId: string): Promise<void>;
}
