import { describe, expect, it } from 'vitest';
import { EventStatus, IssueType, TripStatus } from '../../../src/domain/enums';
import {
  AlternativeNotFoundError, EventNotFoundError, InvalidTripStateError,
} from '../../../src/domain/errors';
import { at, makeAlternative, makeTripWithEvents } from './helpers';

describe('Incidencias en el viaje (flujo de dos pasos)', () => {
  it('reportIssue deja el evento en ISSUE con sus alternativas', () => {
    const { trip, train } = makeTripWithEvents();
    const alt = makeAlternative();

    const affected = trip.reportIssue(train.id, IssueType.MISSED, 'Perdí el tren', [alt]);

    expect(affected.status).toBe(EventStatus.ISSUE);
    expect(affected.issueReason).toBe('Perdí el tren');
    expect(affected.alternatives).toHaveLength(1);
  });

  it('reportIssue falla si el evento no existe', () => {
    const { trip } = makeTripWithEvents();
    expect(() => trip.reportIssue('no-existe', IssueType.MISSED, 'x', [])).toThrow(EventNotFoundError);
  });

  it('selectAlternative cancela el evento e inserta los nuevos en su lugar', () => {
    const { trip, train, museum } = makeTripWithEvents();
    const alt = makeAlternative(1, '14:00');
    trip.reportIssue(train.id, IssueType.MISSED, 'Perdí el tren', [alt]);

    const selected = trip.selectAlternative(train.id, alt.id);

    expect(selected.id).toBe(alt.id);
    expect(train.status).toBe(EventStatus.CANCELLED);

    const day1 = trip.itinerary.getDay(1).events;
    expect(day1).toHaveLength(3);
    // orden por hora: tren original (08:00), alternativa (14:00), museo (16:00)
    expect(day1.map((e) => e.title)).toEqual(['Tren a Roma', 'Tren de la tarde', 'Museos Vaticanos']);
    expect(day1[1].isAlternative).toBe(true);
    expect(day1[2].id).toBe(museum.id);
    expect(day1.map((e) => e.order)).toEqual([1, 2, 3]);
  });

  it('selectAlternative falla si la alternativa no existe', () => {
    const { trip, train } = makeTripWithEvents();
    trip.reportIssue(train.id, IssueType.MISSED, 'x', [makeAlternative()]);
    expect(() => trip.selectAlternative(train.id, 'otra')).toThrow(AlternativeNotFoundError);
  });

  it('selectAlternative no deja el viaje a medias si una alternativa queda fuera de fechas', () => {
    const { trip, train } = makeTripWithEvents();
    const fuera = makeAlternative(1, '10:00');
    fuera.newEvents[0].startDateTime = new Date('2026-12-20T10:00:00Z');
    trip.reportIssue(train.id, IssueType.MISSED, 'x', [fuera]);

    expect(() => trip.selectAlternative(train.id, fuera.id)).toThrow(InvalidTripStateError);
    expect(train.status).toBe(EventStatus.ISSUE); // sigue igual
    expect(trip.events).toHaveLength(2);
  });

  it('no se puede elegir una alternativa de un evento que no tuvo incidente', () => {
    const { trip, train } = makeTripWithEvents();
    expect(() => trip.selectAlternative(train.id, 'x')).toThrow(AlternativeNotFoundError);
  });

  it('un evento ya reemplazado no admite otro incidente', () => {
    const { trip, train } = makeTripWithEvents();
    const alt = makeAlternative();
    trip.reportIssue(train.id, IssueType.MISSED, 'x', [alt]);
    trip.selectAlternative(train.id, alt.id);
    expect(() => trip.reportIssue(train.id, IssueType.MISSED, 'otra vez', [])).toThrow(InvalidTripStateError);
  });

  it('en un viaje cancelado no se pueden reportar incidencias', () => {
    const { trip, train } = makeTripWithEvents();
    trip.changeStatus(TripStatus.CANCELLED);
    expect(() => trip.reportIssue(train.id, IssueType.MISSED, 'x', [])).toThrow(InvalidTripStateError);
  });

  it('un mismo día puede recibir alternativas en otra fecha del viaje', () => {
    const { trip, train } = makeTripWithEvents();
    const alt = makeAlternative(2, '09:00');
    trip.reportIssue(train.id, IssueType.MISSED, 'x', [alt]);
    trip.selectAlternative(train.id, alt.id);
    expect(trip.itinerary.getDay(2).events).toHaveLength(1);
    expect(at(2, '09:00').toISOString()).toBe(trip.itinerary.getDay(2).events[0].startDateTime.toISOString());
  });
});
