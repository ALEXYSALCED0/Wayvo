import { IIncidentRepository } from '../../application/ports/IIncidentRepository';
import { IncidentEvent } from '../../domain/entities/IncidentEvent';

export class InMemoryIncidentRepository implements IIncidentRepository {
  private readonly incidents = new Map<string, IncidentEvent>();

  async save(incident: IncidentEvent): Promise<void> {
    this.incidents.set(incident.id, incident);
  }

  async findByTripId(tripId: string): Promise<IncidentEvent[]> {
    return [...this.incidents.values()].filter((i) => i.tripId === tripId);
  }
}
