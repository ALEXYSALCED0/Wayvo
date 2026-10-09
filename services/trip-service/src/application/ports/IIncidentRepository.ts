import { IncidentEvent } from '../../domain/entities/IncidentEvent';

export interface IIncidentRepository {
  save(incident: IncidentEvent): Promise<void>;
  findByTripId(tripId: string): Promise<IncidentEvent[]>;
}
