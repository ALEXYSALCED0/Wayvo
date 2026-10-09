import { ITripRepository } from '../../application/ports/ITripRepository';
import { Trip } from '../../domain/entities/Trip';

// Provisional: los datos se pierden al reiniciar. Luego se cambia por la base de datos real.
export class InMemoryTripRepository implements ITripRepository {
  private readonly trips = new Map<string, Trip>();

  async save(trip: Trip): Promise<void> {
    this.trips.set(trip.id, trip);
  }

  async findById(id: string): Promise<Trip | null> {
    return this.trips.get(id) ?? null;
  }
}
