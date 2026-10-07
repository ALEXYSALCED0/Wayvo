import {
  ProviderReservationRequest,
  ProviderReservationResult,
  ProviderServiceGateway,
} from '../../../application/ports/provider-service.gateway';

export type FakeProviderMode = 'ok' | 'unavailable' | 'error';

// Simula provider-service. Con FAKE_PROVIDER_MODE=unavailable o error se fuerza
// el fallo para demostrar la compensación de la Saga.
export class FakeProviderServiceGateway implements ProviderServiceGateway {
  constructor(private readonly mode: FakeProviderMode) {}

  async reserve(request: ProviderReservationRequest): Promise<ProviderReservationResult> {
    if (this.mode === 'error') throw new Error('provider-service unreachable (simulated)');
    if (this.mode === 'unavailable') return { available: false, reason: 'No availability (simulated)' };
    return { available: true, reservationCode: `FAKE-${request.bookingId.slice(0, 8)}` };
  }
}