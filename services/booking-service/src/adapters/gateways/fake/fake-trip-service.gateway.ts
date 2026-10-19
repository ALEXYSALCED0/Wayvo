import { TripDraft, TripServiceGateway } from '../../../application/ports/trip-service.gateway';
import { IdGenerator } from '../../../application/ports/id-generator.port';
import { LoggerPort } from '../../../application/ports/logger.port';

// Simula trip-service dentro del proceso. Sirve para probar y hacer la demo de
// booking-service sin levantar los demás microservicios (SERVICES_MODE=fake).
export class FakeTripServiceGateway implements TripServiceGateway {
  constructor(private readonly ids: IdGenerator, private readonly logger: LoggerPort) {}

  async createPendingTrip(trip: TripDraft, correlationId: string): Promise<{ tripId: string }> {
    const tripId = this.ids.generate();
    this.logger.info('[fake trip-service] trip created PENDING', { correlationId, tripId, destination: trip.destination });
    return { tripId };
  }

  async confirmTrip(tripId: string, correlationId: string): Promise<void> {
    this.logger.info('[fake trip-service] trip CONFIRMED', { correlationId, tripId });
  }

  async cancelTrip(tripId: string, reason: string, correlationId: string): Promise<void> {
    this.logger.info('[fake trip-service] trip CANCELLED', { correlationId, tripId, reason });
  }
}