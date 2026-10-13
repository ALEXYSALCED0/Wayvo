import { randomUUID } from 'crypto';
import { AlternativeNotFoundError, InvalidDataError, InvalidTripStateError } from '../errors';
import { EventStatus, EventType, ReservationStatus } from '../enums';
import { AlternativeOption } from './AlternativeOption';

export interface EventProps {
  id?: string;
  tripId: string;
  type: EventType;
  title: string;
  description: string;
  startDateTime: Date;
  endDateTime?: Date;
  location?: string;
  status?: EventStatus;
  reservationStatus?: ReservationStatus;
  order?: number;
  isAlternative?: boolean;
  issueReason?: string;
  alternatives?: AlternativeOption[];
  details?: EventDetails;
  replacedByTitle?: string;
  replacesEventTitle?: string;
}

export interface EventDetails {
  platform?: string;
  seat?: string;
  car?: string;
  bookingRef?: string;
  qrAvailable?: boolean;
  price?: number;
  classType?: string;
  provider?: string;
  confirmationCode?: string;
  notes?: string;
}

// Un elemento del itinerario (tren, comida, museo, hotel...).
export class Event {
  readonly id: string;
  readonly tripId: string;
  readonly type: EventType;
  readonly title: string;
  readonly description: string;
  readonly startDateTime: Date;
  readonly endDateTime?: Date;
  readonly location?: string;
  private _reservationStatus: ReservationStatus;
  readonly isAlternative: boolean;
  readonly details?: EventDetails;
  order: number;
  private _status: EventStatus;
  private _issueReason?: string;
  private _alternatives: AlternativeOption[];
  private _replacedByTitle?: string;
  private _replacesEventTitle?: string;

  constructor(props: EventProps) {
    if (props.endDateTime && props.endDateTime < props.startDateTime) {
      throw new InvalidDataError('El evento no puede terminar antes de empezar');
    }
    this.id = props.id ?? randomUUID();
    this.tripId = props.tripId;
    this.type = props.type;
    this.title = props.title;
    this.description = props.description;
    this.startDateTime = props.startDateTime;
    this.endDateTime = props.endDateTime;
    this.location = props.location;
    this._reservationStatus = props.reservationStatus ?? ReservationStatus.NOT_RESERVED;
    this.isAlternative = props.isAlternative ?? false;
    this.details = props.details;
    this.order = props.order ?? 0;
    this._status = props.status ?? EventStatus.PENDING;
    this._issueReason = props.issueReason;
    this._alternatives = props.alternatives ?? [];
    this._replacedByTitle = props.replacedByTitle;
    this._replacesEventTitle = props.replacesEventTitle;
  }

  get reservationStatus(): ReservationStatus {
    return this._reservationStatus;
  }

  get status(): EventStatus {
    return this._status;
  }

  get issueReason(): string | undefined {
    return this._issueReason;
  }

  get alternatives(): AlternativeOption[] {
    return [...this._alternatives];
  }

  get replacedByTitle(): string | undefined {
    return this._replacedByTitle;
  }

  get replacesEventTitle(): string | undefined {
    return this._replacesEventTitle;
  }

  // Confirmar reserva por el usuario
  setReservationStatus(status: ReservationStatus): void {
    this._reservationStatus = status;
  }

  // Iniciar evento
  start(): void {
    if (this._status !== EventStatus.PENDING) {
      throw new InvalidTripStateError(`No se puede iniciar un evento ${this._status}`);
    }
    this._status = EventStatus.IN_PROGRESS;
  }

  complete(): void {
    if (this._status !== EventStatus.PENDING && this._status !== EventStatus.IN_PROGRESS) {
      throw new InvalidTripStateError(`No se puede completar un evento ${this._status}`);
    }
    this._status = EventStatus.COMPLETED;
  }

  // Solo es posible reportar un problema en un evento pendiente o en progreso
  markIssue(reason: string, alternatives: AlternativeOption[]): void {
    if (this._status !== EventStatus.PENDING && this._status !== EventStatus.IN_PROGRESS && this._status !== EventStatus.ISSUE) {
      throw new InvalidTripStateError(
        `No se puede reportar un problema en un evento ${this._status}`,
      );
    }
    this._status = EventStatus.ISSUE;
    this._issueReason = reason;
    this._alternatives = alternatives;
  }

  // Evento queda cancelado (sustituido por una alternativa o descartado).
  cancel(reason?: string, replacedByTitle?: string): void {
    if (this._status !== EventStatus.PENDING && this._status !== EventStatus.IN_PROGRESS && this._status !== EventStatus.ISSUE) {
      throw new InvalidTripStateError(`No se puede cancelar un evento ${this._status}`);
    }
    this._status = EventStatus.CANCELLED;
    if (reason) this._issueReason = reason;
    if (replacedByTitle) this._replacedByTitle = replacedByTitle;
    this._alternatives = [];
  }

  findAlternative(alternativeId: string): AlternativeOption {
    const found = this._alternatives.find((a) => a.id === alternativeId);
    if (!found) throw new AlternativeNotFoundError(alternativeId);
    return found;
  }
}
