import { AlternativeOption, AlternativeOptionProps } from '../../../domain/entities/AlternativeOption';
import { Event, EventDetails } from '../../../domain/entities/Event';
import { IncidentEvent } from '../../../domain/entities/IncidentEvent';
import { Trip } from '../../../domain/entities/Trip';
import {
  EventStatus, EventType, IssueType, ReservationStatus, TripStatus,
} from '../../../domain/enums';
import { Prisma } from './prisma.client';

// Traduce entre las entidades del dominio y las filas de la Trip DB.
// El dominio no sabe nada de Prisma: toda la conversión vive aquí (capa de infraestructura).

type TripRow = Prisma.TripGetPayload<{ include: { events: true } }>;
type EventRow = TripRow['events'][number];
type IncidentRow = Prisma.IncidentGetPayload<object>;

// Las alternativas se guardan como JSON; al leerlas, las fechas vuelven como texto.
type StoredAlternative = Omit<AlternativeOptionProps, 'newEvents'> & {
  newEvents: Array<Omit<AlternativeOptionProps['newEvents'][number], 'startDateTime' | 'endDateTime'> & {
    startDateTime: string;
    endDateTime?: string;
  }>;
};

function alternativeToJson(a: AlternativeOption): Prisma.InputJsonValue {
  return {
    id: a.id,
    title: a.title,
    description: a.description,
    type: a.type,
    provider: a.provider,
    price: a.price,
    currency: a.currency,
    isRecommended: a.isRecommended,
    departureTime: a.departureTime,
    arrivalTime: a.arrivalTime,
    duration: a.duration,
    isFastest: a.isFastest,
    isBestValue: a.isBestValue,
    scoreMatch: a.scoreMatch,
    newEvents: a.newEvents.map((d) => ({
      type: d.type,
      title: d.title,
      description: d.description,
      location: d.location,
      startDateTime: d.startDateTime.toISOString(),
      endDateTime: d.endDateTime?.toISOString(),
    })),
  } as Prisma.InputJsonValue;
}

function alternativeFromJson(raw: StoredAlternative): AlternativeOption {
  return new AlternativeOption({
    ...raw,
    newEvents: raw.newEvents.map((d) => ({
      ...d,
      startDateTime: new Date(d.startDateTime),
      endDateTime: d.endDateTime ? new Date(d.endDateTime) : undefined,
    })),
  });
}

export const TripMapper = {
  toDomain(row: TripRow): Trip {
    return new Trip({
      id: row.id,
      userId: row.userId,
      title: row.title,
      destination: row.destination,
      origin: row.origin ?? undefined,
      startDate: row.startDate,
      endDate: row.endDate,
      travelers: row.travelers ?? undefined,
      description: row.description ?? undefined,
      imageUrl: row.imageUrl ?? undefined,
      status: row.status as TripStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      events: row.events.map((e) => TripMapper.eventToDomain(e)),
    });
  },

  eventToDomain(row: EventRow): Event {
    const alternatives = (row.alternatives as unknown as StoredAlternative[] | null) ?? [];
    return new Event({
      id: row.id,
      tripId: row.tripId,
      type: row.type as EventType,
      title: row.title,
      description: row.description,
      startDateTime: row.startDateTime,
      endDateTime: row.endDateTime ?? undefined,
      location: row.location ?? undefined,
      status: row.status as EventStatus,
      reservationStatus: row.reservationStatus as ReservationStatus,
      order: row.order,
      isAlternative: row.isAlternative,
      issueReason: row.issueReason ?? undefined,
      replacedByTitle: row.replacedByTitle ?? undefined,
      replacesEventTitle: row.replacesEventTitle ?? undefined,
      details: (row.details as EventDetails | null) ?? undefined,
      alternatives: alternatives.map(alternativeFromJson),
    });
  },

  // Columnas del viaje (sin los eventos).
  toTripData(trip: Trip) {
    return {
      id: trip.id,
      userId: trip.userId,
      title: trip.title,
      destination: trip.destination,
      origin: trip.origin ?? null,
      startDate: trip.startDate,
      endDate: trip.endDate,
      travelers: trip.travelers ?? null,
      description: trip.description ?? null,
      imageUrl: trip.imageUrl ?? null,
      status: trip.status,
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt,
    };
  },

  toEventData(e: Event): Prisma.TripEventCreateManyInput {
    return {
      id: e.id,
      tripId: e.tripId,
      type: e.type,
      title: e.title,
      description: e.description,
      startDateTime: e.startDateTime,
      endDateTime: e.endDateTime ?? null,
      location: e.location ?? null,
      status: e.status,
      reservationStatus: e.reservationStatus,
      order: e.order,
      isAlternative: e.isAlternative,
      issueReason: e.issueReason ?? null,
      replacedByTitle: e.replacedByTitle ?? null,
      replacesEventTitle: e.replacesEventTitle ?? null,
      details: e.details ? (e.details as Prisma.InputJsonValue) : Prisma.JsonNull,
      alternatives: e.alternatives.map(alternativeToJson),
    };
  },

  incidentToDomain(row: IncidentRow): IncidentEvent {
    return IncidentEvent.restore({
      id: row.id,
      tripId: row.tripId,
      eventId: row.eventId,
      type: row.type as IssueType,
      reason: row.reason,
      occurredAt: row.occurredAt,
      resolved: row.resolved,
    });
  },
};
