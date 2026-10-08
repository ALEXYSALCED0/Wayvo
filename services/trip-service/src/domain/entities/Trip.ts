import { randomUUID } from 'crypto';
import {
  EventNotFoundError, InvalidDataError, InvalidTripStateError,
} from '../errors';
import { IssueType, ReservationStatus, TripStatus } from '../enums';
import { AlternativeOption, EventDraft } from './AlternativeOption';
import { Event } from './Event';
import { Itinerary, dateKey } from './Itinerary';


const ALLOWED: Record<TripStatus, TripStatus[]> = {
  [TripStatus.PENDING]: [TripStatus.CONFIRMED, TripStatus.CANCELLED],
  [TripStatus.CONFIRMED]: [TripStatus.CANCELLED],
  [TripStatus.CANCELLED]: [],
};

export interface TripProps {
  id?: string;
  userId: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  origin?: string;
  title?: string;
  travelers?: number;
  description?: string;
  imageUrl?: string;
  status?: TripStatus;
  events?: Event[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TripChanges {
  title?: string;
  origin?: string;
  destination?: string;
  startDate?: Date;
  endDate?: Date;
  travelers?: number;
  description?: string;
  imageUrl?: string;
}

// Raíz del agregado: guarda los eventos y de ellos se deriva el itinerario.
export class Trip {
  readonly id: string;
  readonly userId: string;
  readonly createdAt: Date;
  title: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  origin?: string;
  travelers?: number;
  description?: string;
  imageUrl?: string;
  private _status: TripStatus;
  private _events: Event[];
  private _updatedAt: Date;

  constructor(props: TripProps) {
    Trip.validateDates(props.startDate, props.endDate);
    Trip.validateTravelers(props.travelers);

    this.id = props.id ?? randomUUID();
    this.userId = props.userId;
    this.destination = props.destination;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.origin = props.origin;
    this.title = props.title ?? `Viaje a ${props.destination}`;
    this.travelers = props.travelers;
    this.description = props.description;
    this.imageUrl = props.imageUrl;
    this._status = props.status ?? TripStatus.PENDING;
    this._events = props.events ? [...props.events] : [];
    this.createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? this.createdAt;
    this.normalizeOrder();
  }

  get status(): TripStatus {
    return this._status;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get events(): Event[] {
    return [...this._events];
  }

  get itinerary(): Itinerary {
    return Itinerary.build(this.startDate, this.endDate, this._events);
  }

  // Estado del viaje

  changeStatus(next: TripStatus): void {
    if (!ALLOWED[this._status].includes(next)) {
      throw new InvalidTripStateError(`No se puede pasar de ${this._status} a ${next}`);
    }
    this._status = next;
    this.touch();
  }

  // Datos del viaje

  update(changes: TripChanges): void {
    this.assertEditable();
    const start = changes.startDate ?? this.startDate;
    const end = changes.endDate ?? this.endDate;
    const travelers = changes.travelers ?? this.travelers;
    Trip.validateDates(start, end);
    Trip.validateTravelers(travelers);
    for (const e of this._events) {
      if (dateKey(e.startDateTime) < dateKey(start) || dateKey(e.startDateTime) > dateKey(end)) {
        throw new InvalidTripStateError('Las nuevas fechas dejan eventos fuera del viaje');
      }
    }

    this.startDate = start;
    this.endDate = end;
    this.travelers = travelers;
    this.title = changes.title ?? this.title;
    this.origin = changes.origin ?? this.origin;
    this.destination = changes.destination ?? this.destination;
    this.description = changes.description ?? this.description;
    this.imageUrl = changes.imageUrl ?? this.imageUrl;
    this.touch();
  }

  // Eventos

  addEvent(draft: EventDraft & { reservationStatus?: ReservationStatus; isAlternative?: boolean }): Event {
    this.assertEditable();
    this.assertInRange(draft.startDateTime);
    const event = new Event({ ...draft, tripId: this.id });
    this._events.push(event);
    this.normalizeOrder();
    this.touch();
    return event;
  }

  getEvent(eventId: string): Event {
    const event = this._events.find((e) => e.id === eventId);
    if (!event) throw new EventNotFoundError(eventId);
    return event;
  }

  // Incidencias (las usa el Mediator)

  // El usuario reporta un problema. El evento queda en ISSUE con las alternativas generadas.
  reportIssue(eventId: string, type: IssueType, reason: string, alternatives: AlternativeOption[]): Event {
    this.assertEditable();
    const event = this.getEvent(eventId);
    event.markIssue(reason, alternatives);
    this.touch();
    return event;
  }

  // El usuario elige una alternativa. El evento afectado se cancela y los eventos nuevos entran al itinerario.
  selectAlternative(eventId: string, alternativeId: string): AlternativeOption {
    this.assertEditable();
    const event = this.getEvent(eventId);
    const selected = event.findAlternative(alternativeId);

    selected.newEvents.forEach((d) => this.assertInRange(d.startDateTime));

    event.cancel();
    selected.newEvents.forEach((draft) =>
      this.addEvent({ ...draft, isAlternative: true }),
    );
    return selected;
  }

  // Internos

  private assertEditable(): void {
    if (this._status === TripStatus.CANCELLED) {
      throw new InvalidTripStateError('No se puede editar un viaje cancelado');
    }
  }

  private assertInRange(date: Date): void {
    const key = dateKey(date);
    if (key < dateKey(this.startDate) || key > dateKey(this.endDate)) {
      throw new InvalidTripStateError('El evento queda fuera de las fechas del viaje');
    }
  }

  // Ordena por hora de inicio.
  private normalizeOrder(): void {
    this._events
      .sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime() || a.order - b.order)
      .forEach((e, i) => { e.order = i + 1; });
  }

  private touch(): void {
    this._updatedAt = new Date();
  }

  private static validateDates(start: Date, end: Date): void {
    if (end < start) {
      throw new InvalidDataError('La fecha de fin no puede ser anterior a la de inicio');
    }
  }

  private static validateTravelers(travelers?: number): void {
    if (travelers !== undefined && (!Number.isInteger(travelers) || travelers < 1)) {
      throw new InvalidDataError('El número de viajeros debe ser un entero mayor o igual a 1');
    }
  }
}
