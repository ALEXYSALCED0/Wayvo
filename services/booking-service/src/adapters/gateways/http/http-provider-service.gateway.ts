import {
  ProviderReleaseRequest,
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

interface ReleaseResponse {
  items?: Array<{ offerId: string; released: boolean; reason?: string }>;
}

// Adapter de salida hacia provider-service (que internamente usa el patrón Adapter
// para hablar con las APIs externas). Usa los dos endpoints de la guía del proyecto:
//   POST /api/v1/providers/check-availability -> { available, reason? }
//   POST /api/v1/providers/confirm            -> { reservationCode }
//   POST /api/v1/providers/release            -> { items: [{ offerId, released }] } (compensación)
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

  async release(request: ProviderReleaseRequest, correlationId: string): Promise<void> {
    const response = await this.http.post<ReleaseResponse>(
      '/api/v1/providers/release',
      { bookingId: request.bookingId, items: request.items },
      correlationId,
    );
    // provider-service responde 200 aunque alguna oferta no se haya podido devolver:
    // eso se convierte en error para que quede como compensación fallida.
    const failed = (response?.items ?? []).filter((item) => !item.released);
    if (failed.length > 0) {
      const detail = failed.map((i) => `${i.offerId}: ${i.reason ?? 'not released'}`).join('; ');
      throw new Error(`Provider capacity not released (${detail})`);
    }
  }
}
