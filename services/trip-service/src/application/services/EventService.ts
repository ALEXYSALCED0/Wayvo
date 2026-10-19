import { IncidentEvent } from '../../domain/entities/IncidentEvent';
import { IssueType } from '../../domain/enums';
import { IIncidentRepository } from '../ports/IIncidentRepository';


export class EventService {
  constructor(private readonly incidents: IIncidentRepository) {}

  async register(
    tripId: string,
    eventId: string,
    type: IssueType,
    reason: string,
  ): Promise<IncidentEvent> {
    const incident = new IncidentEvent(tripId, eventId, type, reason);
    await this.incidents.save(incident);
    return incident;
  }

  // Marca como resuelto el incidente abierto de ese evento.
  async resolve(tripId: string, eventId: string): Promise<void> {
    const open = (await this.incidents.findByTripId(tripId)).find(
      (i) => i.eventId === eventId && !i.resolved,
    );
    if (!open) return;
    open.markResolved();
    await this.incidents.save(open);
  }
}
