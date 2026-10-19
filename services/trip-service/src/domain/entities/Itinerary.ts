import { DayNotFoundError } from '../errors';
import { DayPlan } from './DayPlan';
import { Event } from './Event';

const DAY_MS = 24 * 60 * 60 * 1000;

// Fecha en formato "YYYY-MM-DD" (UTC).
export function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// El itinerario no se guarda: se calcula agrupando los eventos del viaje por día.
export class Itinerary {
  constructor(public readonly days: DayPlan[] = []) {}

  static build(startDate: Date, endDate: Date, events: Event[]): Itinerary {
    const first = Date.parse(dateKey(startDate));
    const last = Date.parse(dateKey(endDate));
    const days: DayPlan[] = [];

    for (let t = first, n = 1; t <= last; t += DAY_MS, n++) {
      const key = dateKey(new Date(t));
      const dayEvents = events
        .filter((e) => dateKey(e.startDateTime) === key)
        .sort((a, b) => a.order - b.order);
      days.push(new DayPlan(n, key, dayEvents));
    }
    return new Itinerary(days);
  }

  getDay(dayNumber: number): DayPlan {
    const day = this.days.find((d) => d.dayNumber === dayNumber);
    if (!day) throw new DayNotFoundError(dayNumber);
    return day;
  }
}
