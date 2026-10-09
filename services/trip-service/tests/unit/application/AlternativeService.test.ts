import { describe, expect, it } from 'vitest';
import { dateKey } from '../../../src/domain/entities/Itinerary';
import { EventType, IssueType } from '../../../src/domain/enums';
import { AlternativeService } from '../../../src/application/services/AlternativeService';
import { at, makeTripWithEvents } from '../domain/helpers';

const service = new AlternativeService();

describe.each(Object.values(IssueType))('AlternativeService con incidente %s', (type) => {
  it('propone al menos dos opciones y solo la primera es la recomendada', () => {
    const { train } = makeTripWithEvents();
    const options = service.generate(type, train);

    expect(options.length).toBeGreaterThanOrEqual(2);
    expect(options[0].isRecommended).toBe(true);
    expect(options.filter((o) => o.isRecommended)).toHaveLength(1);
    expect(options.every((o) => o.newEvents.length > 0)).toBe(true);
  });

  it('los eventos nuevos quedan el mismo día que el evento original', () => {
    const { train } = makeTripWithEvents();
    for (const option of service.generate(type, train)) {
      for (const draft of option.newEvents) {
        expect(dateKey(draft.startDateTime)).toBe(dateKey(train.startDateTime));
      }
    }
  });

  it('cualquier opción se puede elegir, incluso con un evento a última hora del día', () => {
    // Evento nocturno en el último día del viaje: desplazarlo no debe sacarlo de las fechas
    const optionCount = service.generate(type, makeTripWithEvents().train).length;

    for (let i = 0; i < optionCount; i++) {
      const { trip } = makeTripWithEvents();
      const night = trip.addEvent({
        type: EventType.TRANSPORT, title: 'Tren nocturno', description: 'Último tren',
        startDateTime: at(3, '22:30'), endDateTime: at(3, '23:30'),
      });
      const options = service.generate(type, night);
      trip.reportIssue(night.id, type, 'x', options);
      expect(() => trip.selectAlternative(night.id, options[i].id), `opción ${i}`).not.toThrow();
    }
  });
});

describe('AlternativeService (casos concretos)', () => {
  it('si se pierde un transporte ofrece el siguiente y también un bus', () => {
    const { train } = makeTripWithEvents();
    const options = service.generate(IssueType.MISSED, train);
    expect(options[0].newEvents[0].title).toBe('Tren a Roma (reprogramado)');
    expect(options[1].title).toBe('Cambiar a bus');
  });

  it('si se pierde algo que no es transporte ofrece tiempo libre, no un bus', () => {
    const { museum } = makeTripWithEvents();
    const options = service.generate(IssueType.MISSED, museum);
    expect(options[1].title).toBe('Dejar tiempo libre');
  });

  it('conserva la duración del evento al reprogramarlo', () => {
    const { trip } = makeTripWithEvents();
    const tour = trip.addEvent({
      type: EventType.TOUR, title: 'Tour', description: 'Centro histórico',
      startDateTime: at(2, '10:00'), endDateTime: at(2, '12:00'),
    });
    const [first] = service.generate(IssueType.CANCELLED, tour);
    const draft = first.newEvents[0];
    expect(draft.endDateTime!.getTime() - draft.startDateTime.getTime()).toBe(2 * 60 * 60 * 1000);
  });
});
