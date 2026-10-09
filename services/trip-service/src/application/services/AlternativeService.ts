import { AlternativeOption, EventDraft } from '../../domain/entities/AlternativeOption';
import { Event } from '../../domain/entities/Event';
import { AlternativeType, EventType, IssueType } from '../../domain/enums';

const MINUTE_MS = 60 * 1000;

// Solo genera opciones de cambio con reglas sencillas. No conoce a TripService ni a EventService.
// La primera opción de cada lista es la recomendada.
export class AlternativeService {
  generate(type: IssueType, event: Event): AlternativeOption[] {
    switch (type) {
      case IssueType.MISSED:
        return [
          this.later(event, 120, 'Tomar la siguiente opción disponible', true),
          this.isTransport(event) ? this.byBus(event) : this.freeTime(event),
        ];
      case IssueType.CANCELLED:
        return [
          this.later(event, 90, 'Buscar una opción equivalente', true),
          this.freeTime(event),
        ];
      case IssueType.UNAVAILABLE:
        return [
          this.nearbyActivity(event),
          this.later(event, 180, 'Reservar para más tarde', false),
        ];
      case IssueType.USER_CHANGED_PLAN:
        return [this.reorganize(event), this.freeTime(event)];
      default:
        return [];
    }
  }

  // ---- opciones ----

  // El mismo evento, pero más tarde.
  private later(event: Event, minutes: number, title: string, recommended: boolean): AlternativeOption {
    const draft = this.draftFrom(event, {
      type: event.type,
      title: `${event.title} (reprogramado)`,
      description: `${event.description}. Reprogramado para más tarde.`,
    }, minutes);
    return new AlternativeOption({
      title,
      description: `Se mueve "${event.title}" a una hora posterior del mismo día.`,
      newEvents: [draft],
      type: this.alternativeType(event.type),
      isRecommended: recommended,
      ...this.times(draft),
    });
  }

  private byBus(event: Event): AlternativeOption {
    const draft = this.draftFrom(event, {
      type: EventType.TRANSPORT,
      title: 'Bus al destino',
      description: 'Se reemplaza el viaje original por un bus.',
    }, 60);
    return new AlternativeOption({
      title: 'Cambiar a bus',
      description: 'Se cambia el transporte por un bus que sale más pronto.',
      newEvents: [draft],
      type: AlternativeType.BUS,
      ...this.times(draft),
    });
  }

  private freeTime(event: Event): AlternativeOption {
    const draft = this.draftFrom(event, {
      type: EventType.ACTIVITY,
      title: 'Tiempo libre',
      description: 'Espacio libre para descansar o pasear.',
    }, 0);
    return new AlternativeOption({
      title: 'Dejar tiempo libre',
      description: `Se quita "${event.title}" y se deja ese espacio libre.`,
      newEvents: [draft],
      type: AlternativeType.ACTIVITY,
    });
  }

  private nearbyActivity(event: Event): AlternativeOption {
    const draft = this.draftFrom(event, {
      type: EventType.ACTIVITY,
      title: 'Actividad cercana disponible',
      description: 'Plan alternativo cerca del lugar original.',
    }, 0);
    return new AlternativeOption({
      title: 'Visitar otra actividad cercana',
      description: `Se reemplaza "${event.title}" por un plan cercano que sí está disponible.`,
      newEvents: [draft],
      type: AlternativeType.ACTIVITY,
      isRecommended: true,
    });
  }

  private reorganize(event: Event): AlternativeOption {
    const draft = this.draftFrom(event, {
      type: EventType.ACTIVITY,
      title: 'Plan reorganizado',
      description: 'Actividad ajustada a tu nuevo plan.',
    }, 0);
    return new AlternativeOption({
      title: 'Reorganizar el día',
      description: 'Se ajusta el día según el cambio que pediste.',
      newEvents: [draft],
      type: AlternativeType.COMBINED,
      isRecommended: true,
    });
  }

  // ---- ayudas ----

  // Crea un evento nuevo en el mismo lugar, desplazado unos minutos.
  // Nunca pasa de las 23:59 del mismo día, para que siga dentro de las fechas del viaje.
  private draftFrom(
    event: Event,
    base: { type: EventType; title: string; description: string },
    shiftMinutes: number,
  ): EventDraft {
    const dayEnd = Date.UTC(
      event.startDateTime.getUTCFullYear(),
      event.startDateTime.getUTCMonth(),
      event.startDateTime.getUTCDate(),
      23, 59,
    );
    const start = Math.min(event.startDateTime.getTime() + shiftMinutes * MINUTE_MS, dayEnd);
    const duration = event.endDateTime
      ? event.endDateTime.getTime() - event.startDateTime.getTime()
      : undefined;
    const end = duration === undefined ? undefined : Math.min(start + duration, dayEnd);

    return {
      ...base,
      location: event.location,
      startDateTime: new Date(start),
      endDateTime: end === undefined ? undefined : new Date(end),
    };
  }

  // Horas de salida y llegada en texto, si el evento nuevo tiene hora de fin.
  private times(draft: EventDraft): { departureTime?: string; arrivalTime?: string; duration?: string } {
    if (!draft.endDateTime) return {};
    const minutes = Math.round((draft.endDateTime.getTime() - draft.startDateTime.getTime()) / MINUTE_MS);
    return {
      departureTime: hhmm(draft.startDateTime),
      arrivalTime: hhmm(draft.endDateTime),
      duration: `${Math.floor(minutes / 60)} h ${minutes % 60} min`,
    };
  }

  private isTransport(event: Event): boolean {
    return event.type === EventType.TRANSPORT || event.type === EventType.FLIGHT;
  }

  private alternativeType(type: EventType): AlternativeType {
    const map: Record<EventType, AlternativeType> = {
      [EventType.TRANSPORT]: AlternativeType.TRANSIT,
      [EventType.FLIGHT]: AlternativeType.FLIGHT,
      [EventType.MEAL]: AlternativeType.MEAL,
      [EventType.MUSEUM]: AlternativeType.MUSEUM,
      [EventType.TOUR]: AlternativeType.TOUR,
      [EventType.HOTEL]: AlternativeType.ACCOMMODATION,
      [EventType.ACTIVITY]: AlternativeType.ACTIVITY,
    };
    return map[type];
  }
}

function hhmm(date: Date): string {
  return date.toISOString().slice(11, 16); // "HH:mm" en UTC
}
