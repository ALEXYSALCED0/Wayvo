import { randomUUID } from 'crypto';
import { IssueType } from '../enums';

// Registro de un incidente reportado sobre un evento del viaje.
export class IncidentEvent {
  readonly id: string;
  readonly occurredAt: Date;
  private _resolved = false;

  constructor(
    public readonly tripId: string,
    public readonly eventId: string,
    public readonly type: IssueType,
    public readonly reason: string,
  ) {
    this.id = randomUUID();
    this.occurredAt = new Date();
  }

  // Reconstruye un incidente ya guardado (persistencia) conservando su id, fecha y estado.
  static restore(props: {
    id: string;
    tripId: string;
    eventId: string;
    type: IssueType;
    reason: string;
    occurredAt: Date;
    resolved: boolean;
  }): IncidentEvent {
    const incident = new IncidentEvent(props.tripId, props.eventId, props.type, props.reason);
    Object.assign(incident, { id: props.id, occurredAt: props.occurredAt, _resolved: props.resolved });
    return incident;
  }

  get resolved(): boolean {
    return this._resolved;
  }

  markResolved(): void {
    this._resolved = true;
  }
}
