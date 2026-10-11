import { AlternativeOption } from '../../domain/entities/AlternativeOption';
import { Event } from '../../domain/entities/Event';
import { Trip } from '../../domain/entities/Trip';
import { IssueType, TripStatus } from '../../domain/enums';
import { TripNotFoundError } from '../../domain/errors';
import { ITripRepository } from '../ports/ITripRepository';

// Recalcula y actualiza el itinerario del viaje. No conoce a EventService.
export class TripService {
  constructor(private readonly trips: ITripRepository) {}

  async createTrip(input: {
    userId: string;
    destination: string;
    startDate: Date;
    endDate: Date;
    origin?: string;
    title?: string;
    travelers?: number;
    description?: string;
    imageUrl?: string;
    events?: Parameters<Trip['addEvent']>[0][];
  }): Promise<Trip> {
    const { events = [], ...data } = input;
    const trip = new Trip(data);
    // Los eventos del itinerario entran uno a uno:
    // el viaje valida que estén dentro de sus fechas y les asigna el orden.
    events.forEach((event) => trip.addEvent(event));
    await this.trips.save(trip);
    return trip;
  }

  async getTrip(tripId: string): Promise<Trip> {
    const trip = await this.trips.findById(tripId);
    if (!trip) throw new TripNotFoundError(tripId);
    return trip;
  }

  // La Saga confirma el viaje cuando todos los servicios respondieron bien.
  async confirmTrip(tripId: string): Promise<Trip> {
    return this.moveTo(tripId, TripStatus.CONFIRMED);
  }

  // Compensación de la Saga (o cancelación del usuario).
  async cancelTrip(tripId: string): Promise<Trip> {
    return this.moveTo(tripId, TripStatus.CANCELLED);
  }

  // Si el viaje ya está en ese estado no hace nada: así la Saga puede
  // reintentar la llamada sin que falle (operación idempotente).
  private async moveTo(tripId: string, status: TripStatus): Promise<Trip> {
    const trip = await this.getTrip(tripId);
    if (trip.status === status) return trip;
    trip.changeStatus(status);
    await this.trips.save(trip);
    return trip;
  }

  // Paso 1: el evento queda en ISSUE con las alternativas propuestas.
  async reportIssue(
    tripId: string,
    eventId: string,
    type: IssueType,
    reason: string,
    alternatives: AlternativeOption[],
  ): Promise<{ trip: Trip; event: Event }> {
    const trip = await this.getTrip(tripId);
    const event = trip.reportIssue(eventId, type, reason, alternatives);
    await this.trips.save(trip);
    return { trip, event };
  }

  // Paso 2: se cancela el evento afectado y los eventos nuevos entran al itinerario.
  async selectAlternative(
    tripId: string,
    eventId: string,
    alternativeId: string,
  ): Promise<{ trip: Trip; selected: AlternativeOption }> {
    const trip = await this.getTrip(tripId);
    const selected = trip.selectAlternative(eventId, alternativeId);
    await this.trips.save(trip);
    return { trip, selected };
  }
}
