import { TripDraft, TripServiceGateway } from '../../../application/ports/trip-service.gateway';
import { HttpClient, HttpGatewayError } from './http-client';

// Adapter de salida: implementa el puerto TripServiceGateway llamando a trip-service.
// Contrato acordado (ver guía 4):
//   POST /api/v1/trips              -> crea el viaje en PENDING, responde { id }
//   POST /api/v1/trips/{id}/confirm -> PENDING -> CONFIRMED
//   POST /api/v1/trips/{id}/cancel  -> CANCELLED, body { reason }
export class HttpTripServiceGateway implements TripServiceGateway {
  constructor(private readonly http: HttpClient) {}

  async createPendingTrip(trip: TripDraft, correlationId: string): Promise<{ tripId: string }> {
    const created = await this.http.post<{ id?: string; tripId?: string }>(
      '/api/v1/trips',
      { ...trip, status: 'PENDING' },
      correlationId,
    );
    const tripId = created?.tripId ?? created?.id;
    if (!tripId) throw new HttpGatewayError('trip-service', null, 'response without trip id');
    return { tripId };
  }

  async confirmTrip(tripId: string, correlationId: string): Promise<void> {
    await this.http.post(`/api/v1/trips/${encodeURIComponent(tripId)}/confirm`, {}, correlationId);
  }

  async cancelTrip(tripId: string, reason: string, correlationId: string): Promise<void> {
    await this.http.post(`/api/v1/trips/${encodeURIComponent(tripId)}/cancel`, { reason }, correlationId);
  }
}