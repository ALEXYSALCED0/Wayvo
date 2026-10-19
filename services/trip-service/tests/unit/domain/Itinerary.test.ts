import { describe, expect, it } from 'vitest';
import { DayNotFoundError } from '../../../src/domain/errors';
import { EventType } from '../../../src/domain/enums';
import { at, makeTrip, makeTripWithEvents } from './helpers';

describe('Itinerary (derivado de los eventos)', () => {
  it('tiene un día por cada fecha del viaje, incluso los vacíos', () => {
    const it3 = makeTrip().itinerary;
    expect(it3.days).toHaveLength(3);
    expect(it3.days.map((d) => d.date)).toEqual(['2026-12-01', '2026-12-02', '2026-12-03']);
    expect(it3.days.map((d) => d.dayNumber)).toEqual([1, 2, 3]);
  });

  it('agrupa los eventos en su día y los ordena', () => {
    const { trip, train, museum } = makeTripWithEvents();
    trip.addEvent({
      type: EventType.MEAL, title: 'Almuerzo', description: 'x', startDateTime: at(2, '13:00'),
    });
    const itinerary = trip.itinerary;
    expect(itinerary.getDay(1).events.map((e) => e.id)).toEqual([train.id, museum.id]);
    expect(itinerary.getDay(2).events).toHaveLength(1);
    expect(itinerary.getDay(3).events).toHaveLength(0);
  });

  it('getDay lanza error si el día no existe', () => {
    expect(() => makeTrip().itinerary.getDay(9)).toThrow(DayNotFoundError);
  });
});
