import { InvalidDataError } from '../errors';
import { Event } from './Event';

export class DayPlan {
  constructor(
    public readonly dayNumber: number,
    public readonly date: string, // "YYYY-MM-DD"
    public readonly events: Event[] = [],
  ) {
    if (dayNumber < 1) {
      throw new InvalidDataError('El número de día debe ser mayor o igual a 1');
    }
  }
}
