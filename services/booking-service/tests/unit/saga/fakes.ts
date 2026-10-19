import {
  ProviderReservationRequest,
  ProviderReservationResult,
  ProviderServiceGateway,
} from '../../../src/application/ports/provider-service.gateway';
import { TripDraft, TripServiceGateway } from '../../../src/application/ports/trip-service.gateway';

// Dobles de prueba de los otros microservicios. Registran cada llamada para
// poder verificar el orden de los pasos y de las compensaciones.

export class FakeTripService implements TripServiceGateway {
  status = new Map<string, 'PENDING' | 'CONFIRMED' | 'CANCELLED'>();
  calls: string[] = [];
  failOn: 'create' | 'confirm' | 'cancel' | null = null;

  async createPendingTrip(_trip: TripDraft): Promise<{ tripId: string }> {
    this.calls.push('createPendingTrip');
    if (this.failOn === 'create') throw new Error('trip-service down');
    this.status.set('trip-1', 'PENDING');
    return { tripId: 'trip-1' };
  }

  async confirmTrip(tripId: string): Promise<void> {
    this.calls.push('confirmTrip');
    if (this.failOn === 'confirm') throw new Error('trip-service timeout');
    this.status.set(tripId, 'CONFIRMED');
  }

  async cancelTrip(tripId: string): Promise<void> {
    this.calls.push('cancelTrip');
    if (this.failOn === 'cancel') throw new Error('trip-service down during compensation');
    this.status.set(tripId, 'CANCELLED');
  }
}

export class FakeProviderService implements ProviderServiceGateway {
  mode: 'ok' | 'unavailable' | 'error' = 'ok';
  requests: ProviderReservationRequest[] = [];

  async reserve(request: ProviderReservationRequest): Promise<ProviderReservationResult> {
    this.requests.push(request);
    if (this.mode === 'error') throw new Error('provider-service 503');
    if (this.mode === 'unavailable') return { available: false, reason: 'No rooms left' };
    return { available: true, reservationCode: 'RSV-001' };
  }
}