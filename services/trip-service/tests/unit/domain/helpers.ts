import { AlternativeOption } from '../../../src/domain/entities/AlternativeOption';
import { Event } from '../../../src/domain/entities/Event';
import { Trip } from '../../../src/domain/entities/Trip';
import { EventType } from '../../../src/domain/enums';

// Viaje de 3 días: 1, 2 y 3 de diciembre de 2026 (en UTC).
export const at = (day: number, time: string) => new Date(`2026-12-0${day}T${time}:00Z`);

export function makeTrip(): Trip {
  return new Trip({
    userId: 'u1',
    destination: 'Roma',
    origin: 'Milán',
    startDate: at(1, '00:00'),
    endDate: at(3, '00:00'),
  });
}

// Viaje con un tren el día 1 a las 08:00 y un museo a las 16:00.
export function makeTripWithEvents(): { trip: Trip; train: Event; museum: Event } {
  const trip = makeTrip();
  const train = trip.addEvent({
    type: EventType.TRANSPORT, title: 'Tren a Roma', description: 'Tren de la mañana',
    startDateTime: at(1, '08:00'),
  });
  const museum = trip.addEvent({
    type: EventType.MUSEUM, title: 'Museos Vaticanos', description: 'Visita guiada',
    startDateTime: at(1, '16:00'),
  });
  return { trip, train, museum };
}

export function makeAlternative(day = 1, time = '14:00'): AlternativeOption {
  return new AlternativeOption({
    title: 'Siguiente tren',
    description: 'Tren de la tarde',
    isRecommended: true,
    newEvents: [{
      type: EventType.TRANSPORT, title: 'Tren de la tarde',
      description: 'Siguiente tren disponible', startDateTime: at(day, time),
    }],
  });
}
