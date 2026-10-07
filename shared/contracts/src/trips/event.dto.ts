import { AlternativeOption } from './incident.dto';

export enum EventType {
  TRANSPORT = 'TRANSPORT',
  FLIGHT = 'FLIGHT',
  MEAL = 'MEAL',
  MUSEUM = 'MUSEUM',
  TOUR = 'TOUR',
  HOTEL = 'HOTEL',
  ACTIVITY = 'ACTIVITY',
}

export enum EventStatus {
  PENDING = 'PENDING',       // Programado / por realizar
  COMPLETED = 'COMPLETED',   // Finalizado / concurrido
  ISSUE = 'ISSUE',           // Afectado por incidencia o disrupción
  CANCELLED = 'CANCELLED',   // Cancelado o sustituido
}

export enum ReservationStatus {
  NOT_RESERVED = 'NOT_RESERVED',
  CONFIRMED = 'CONFIRMED',
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

export interface Event {
  id: string;
  tripId: string;
  type: EventType;
  typeLabel?: string;
  title: string;
  description: string;
  location?: string;
  startDateTime: string;
  endDateTime?: string;
  time: string;                     // Human-readable formatted time (e.g. "14:15 - 17:30")
  status: EventStatus;
  statusLabel?: string;
  reservationStatus: ReservationStatus;
  order: number;
  details?: EventDetails;
  isAlternative?: boolean;
  alternativeBadge?: string;
  alternatives?: AlternativeOption[];
  issueReason?: string;
}

export interface CreateEventInput {
  tripId: string;
  type: EventType;
  typeLabel?: string;
  title: string;
  description: string;
  location?: string;
  startDateTime: string;
  endDateTime?: string;
  time: string;
  order: number;
  details?: EventDetails;
  reservationStatus?: ReservationStatus;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  location?: string;
  startDateTime?: string;
  endDateTime?: string;
  time?: string;
  status?: EventStatus;
  statusLabel?: string;
  reservationStatus?: ReservationStatus;
  details?: EventDetails;
}
