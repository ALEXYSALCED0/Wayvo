import {
  ProviderReservationRequest,
  ProviderReservationResult,
  ProviderServiceGateway,
} from '../../../application/ports/provider-service.gateway';
import { HttpClient } from './http-client';

interface AvailabilityResponse {
  available: boolean;
  reason?: string;
}

interface ConfirmResponse {
  reservationCode?: string;
  confirmationCode?: string;
}

// Adapter de salida hacia provider-service (que internamente usa el patrón Adapter
// para hablar con las APIs externas). Usa los dos endpoints de la guía del proyecto:
//   POST /api/v1/providers/check-availability -> { available, reason? }
//   POST /api/v1/providers/confirm            -> { reservationCode }
export class HttpProviderServiceGateway implements ProviderServiceGateway {
  constructor(private readonly http: HttpClient) {}

  async reserve(request: ProviderReservationRequest, correlationId: string): Promise<ProviderReservationResult> {
    const availability = await this.http.post<AvailabilityResponse>(
      '/api/v1/providers/check-availability',
      { items: request.items },
      correlationId,
    );
    if (!availability?.available) {
      return { available: false, reason: availability?.reason ?? 'Provider reported no availability' };
    }

    const confirmation = await this.http.post<ConfirmResponse>(
      '/api/v1/providers/confirm',
      { bookingId: request.bookingId, items: request.items },
      correlationId,
    );
    const reservationCode = confirmation?.reservationCode ?? confirmation?.confirmationCode;
    if (!reservationCode) {
      return { available: false, reason: 'Provider confirmed without a reservation code' };
    }
    return { available: true, reservationCode };
  }
}