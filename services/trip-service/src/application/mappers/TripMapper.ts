import type {
  AlternativeOption as AlternativeOptionDTO,
  CreateTripInput,
  Event as EventDTO,
  Trip as TripDTO,
} from '@wayvo/contracts';
import { AlternativeOption } from '../../domain/entities/AlternativeOption';
import { Event } from '../../domain/entities/Event';
import { Trip } from '../../domain/entities/Trip';
import { EventStatus, EventType, IssueType, ReservationStatus } from '../../domain/enums';

// Campos de un evento entrante que usa el servicio.
type CreateTripEventDTO = Pick<
  NonNullable<CreateTripInput['events']>[number],
  'type' | 'title' | 'description' | 'location' | 'startDateTime' | 'endDateTime' | 'details'
> & { reservationStatus?: string };
import { InvalidDataError } from '../../domain/errors';

// Se traducen los objetos del dominio a los DTOs de @wayvo/contracts.

const TYPE_LABELS: Record<EventType, string> = {
  [EventType.TRANSPORT]: 'Transporte',
  [EventType.FLIGHT]: 'Vuelo',
  [EventType.MEAL]: 'Comida',
  [EventType.MUSEUM]: 'Museo',
  [EventType.TOUR]: 'Tour',
  [EventType.HOTEL]: 'Alojamiento',
  [EventType.ACTIVITY]: 'Actividad',
};

const STATUS_LABELS: Record<EventStatus, string> = {
  [EventStatus.PENDING]: 'Pendiente',
  [EventStatus.IN_PROGRESS]: 'En curso',
  [EventStatus.COMPLETED]: 'Completado',
  [EventStatus.ISSUE]: 'Con incidencia',
  [EventStatus.CANCELLED]: 'Cancelado',
};

// "14:15" o "14:15 - 17:30" (hora UTC)
export function formatTime(start: Date, end?: Date): string {
  const hhmm = (d: Date) => d.toISOString().slice(11, 16);
  return end ? `${hhmm(start)} - ${hhmm(end)}` : hhmm(start);
}

// El tipo de incidente llega del contrato: se comprueba que sea uno válido.
export function toDomainIssueType(value: string): IssueType {
  if (!Object.values(IssueType).includes(value as IssueType)) {
    throw new InvalidDataError(`Tipo de incidente no válido: ${value}`);
  }
  return value as IssueType;
}


export function parseUtcDate(value: string): Date {
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(value);
  const date = new Date(value.includes('T') && !hasZone ? `${value}Z` : value);
  if (Number.isNaN(date.getTime())) {
    throw new InvalidDataError(`Fecha no válida: ${value}`);
  }
  return date;
}


export function toEventDraft(dto: CreateTripEventDTO) {
  return {
    type: toDomainEventType(dto.type),
    title: dto.title,
    description: dto.description,
    location: dto.location,
    startDateTime: parseUtcDate(dto.startDateTime),
    endDateTime: dto.endDateTime ? parseUtcDate(dto.endDateTime) : undefined,
    reservationStatus: dto.reservationStatus as unknown as ReservationStatus | undefined,
    details: dto.details,
  };
}

function toDomainEventType(value: string): EventType {
  const normalized = (value as string) === 'ACCOMMODATION' ? EventType.HOTEL : value;
  if (!Object.values(EventType).includes(normalized as EventType)) {
    throw new InvalidDataError(`Tipo de evento no válido: ${value}`);
  }
  return normalized as EventType;
}

export function toAlternativeDTO(a: AlternativeOption): AlternativeOptionDTO {
  return {
    id: a.id,
    title: a.title,
    description: a.description,
    type: a.type as AlternativeOptionDTO['type'],
    provider: a.provider,
    departureTime: a.departureTime,
    arrivalTime: a.arrivalTime,
    duration: a.duration,
    price: a.price,
    currency: a.currency,
    isFastest: a.isFastest,
    isBestValue: a.isBestValue,
    isRecommended: a.isRecommended,
    scoreMatch: a.scoreMatch,
    newEventsToInject: a.newEvents.map((d) => ({
      title: d.title,
      description: d.description,
      time: formatTime(d.startDateTime, d.endDateTime),
      type: d.type as unknown as EventDTO['type'],
      typeLabel: TYPE_LABELS[d.type],
      location: d.location,
    })),
  };
}

export function toEventDTO(e: Event): EventDTO {
  const alternatives = e.alternatives;
  return {
    id: e.id,
    tripId: e.tripId,
    type: e.type as unknown as EventDTO['type'],
    typeLabel: TYPE_LABELS[e.type],
    title: e.title,
    description: e.description,
    location: e.location,
    startDateTime: e.startDateTime.toISOString(),
    endDateTime: e.endDateTime?.toISOString(),
    time: formatTime(e.startDateTime, e.endDateTime),
    status: e.status as unknown as EventDTO['status'],
    statusLabel: STATUS_LABELS[e.status],
    reservationStatus: e.reservationStatus as unknown as EventDTO['reservationStatus'],
    order: e.order,
    details: e.details,
    isAlternative: e.isAlternative,
    alternativeBadge: e.isAlternative ? 'Sustituto IA' : undefined,
    alternatives: alternatives.length > 0 ? alternatives.map(toAlternativeDTO) : undefined,
    issueReason: e.issueReason,
    replacedByTitle: (e as any).replacedByTitle,
    replacesEventTitle: (e as any).replacesEventTitle,
  };
}

export function toTripDTO(t: Trip): TripDTO {
  return {
    id: t.id,
    userId: t.userId,
    title: t.title,
    origin: t.origin,
    destination: t.destination,
    startDate: t.startDate.toISOString(),
    endDate: t.endDate.toISOString(),
    status: t.status,
    travelers: t.travelers,
    imageUrl: t.imageUrl,
    description: t.description,
    events: t.events.map(toEventDTO),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}
