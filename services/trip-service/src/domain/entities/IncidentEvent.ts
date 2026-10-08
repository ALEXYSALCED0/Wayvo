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

  get resolved(): boolean {
    return this._resolved;
  }

  markResolved(): void {
    this._resolved = true;
  }
}
