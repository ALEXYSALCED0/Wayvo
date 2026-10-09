import type {
  TripMediatorIncidentInput,
  TripMediatorSelectAlternativeInput,
} from '@wayvo/contracts';
import { beforeEach, describe, expect, it } from 'vitest';
import { EventStatus, IssueType, TripStatus } from '../../../src/domain/enums';
import {
  AlternativeNotFoundError, EventNotFoundError, InvalidDataError,
  InvalidTripStateError, TripNotFoundError,
} from '../../../src/domain/errors';
import { buildContainer } from '../../../src/infrastructure/container';
import { makeTripWithEvents } from '../domain/helpers';

// Los DTOs usan los enums de @wayvo/contracts.
const incident = (
  tripId: string, eventId: string, type: string = IssueType.MISSED, reason = 'Perdí el tren',
): TripMediatorIncidentInput => ({ tripId, eventId, type: type as TripMediatorIncidentInput['type'], reason });

const selection = (
  tripId: string, eventId: string, alternativeId: string,
): TripMediatorSelectAlternativeInput => ({ tripId, eventId, alternativeId });

describe('TripMediator', () => {
  let c: ReturnType<typeof buildContainer>;
  let fixture: ReturnType<typeof makeTripWithEvents>;

  beforeEach(async () => {
    c = buildContainer();
    fixture = makeTripWithEvents(); // tren 08:00 y museo 16:00 el día 1
    await c.tripRepository.save(fixture.trip);
  });

  describe('reportIncident (paso 1)', () => {
    it('deja el evento en ISSUE, propone alternativas y devuelve el viaje actualizado', async () => {
      const { trip, train } = fixture;

      const res = await c.mediator.reportIncident(incident(trip.id, train.id));

      expect(res.affectedEvent.id).toBe(train.id);
      expect(res.affectedEvent.status).toBe('ISSUE');
      expect(res.affectedEvent.issueReason).toBe('Perdí el tren');
      expect(res.alternatives.length).toBeGreaterThanOrEqual(2);
      expect(res.alternatives[0].isRecommended).toBe(true);
      expect(res.affectedEvent.alternatives).toHaveLength(res.alternatives.length);
      const inTrip = res.updatedTrip.events!.find((e) => e.id === train.id)!;
      expect(inTrip.status).toBe('ISSUE');
    });

    it('registra el incidente sin resolver', async () => {
      const { trip, train } = fixture;
      await c.mediator.reportIncident(incident(trip.id, train.id));

      const saved = await c.incidentRepository.findByTripId(trip.id);
      expect(saved).toHaveLength(1);
      expect(saved[0].eventId).toBe(train.id);
      expect(saved[0].type).toBe(IssueType.MISSED);
      expect(saved[0].resolved).toBe(false);
    });

    it('entrega los datos en el formato del contrato (fechas ISO, hora y etiquetas)', async () => {
      const { trip, train } = fixture;
      const res = await c.mediator.reportIncident(incident(trip.id, train.id));

      expect(res.affectedEvent.startDateTime).toBe('2026-12-01T08:00:00.000Z');
      expect(res.affectedEvent.time).toBe('08:00');
      expect(res.affectedEvent.typeLabel).toBe('Transporte');
      expect(res.affectedEvent.statusLabel).toBe('Con incidencia');
      expect(res.updatedTrip.startDate).toBe('2026-12-01T00:00:00.000Z');
      expect(res.alternatives[0].newEventsToInject[0].time).toBe('10:00');
    });

    it('falla si el viaje no existe', async () => {
      await expect(c.mediator.reportIncident(incident('no-existe', fixture.train.id)))
        .rejects.toThrow(TripNotFoundError);
    });

    it('falla si el evento no existe y no registra nada', async () => {
      await expect(c.mediator.reportIncident(incident(fixture.trip.id, 'no-existe')))
        .rejects.toThrow(EventNotFoundError);
      expect(await c.incidentRepository.findByTripId(fixture.trip.id)).toHaveLength(0);
    });

    it('rechaza un tipo de incidente que no existe', async () => {
      await expect(c.mediator.reportIncident(incident(fixture.trip.id, fixture.train.id, 'OTRO')))
        .rejects.toThrow(InvalidDataError);
    });

    it('si el viaje rechaza el cambio, no queda un incidente huérfano', async () => {
      const { trip, train } = fixture;
      train.complete(); // un evento ya completado no admite incidentes

      await expect(c.mediator.reportIncident(incident(trip.id, train.id)))
        .rejects.toThrow(InvalidTripStateError);
      expect(await c.incidentRepository.findByTripId(trip.id)).toHaveLength(0);
    });

    it('no permite reportar incidentes en un viaje cancelado', async () => {
      const { trip, train } = fixture;
      trip.changeStatus(TripStatus.CANCELLED);
      await expect(c.mediator.reportIncident(incident(trip.id, train.id)))
        .rejects.toThrow(InvalidTripStateError);
    });
  });

  describe('selectAlternative (paso 2)', () => {
    async function reportAndGetAlternativeId() {
      const { trip, train } = fixture;
      const res = await c.mediator.reportIncident(incident(trip.id, train.id));
      return res.alternatives[0].id;
    }

    it('cancela el evento afectado e inserta los nuevos en el itinerario', async () => {
      const { trip, train, museum } = fixture;
      const altId = await reportAndGetAlternativeId();

      const res = await c.mediator.selectAlternative(selection(trip.id, train.id, altId));

      expect(res.selectedAlternative.id).toBe(altId);
      const events = res.updatedTrip.events!;
      expect(events.find((e) => e.id === train.id)!.status).toBe('CANCELLED');
      expect(events.find((e) => e.id === museum.id)!.status).toBe('PENDING');

      const added = events.find((e) => e.isAlternative)!;
      expect(added.title).toBe('Tren a Roma (reprogramado)');
      expect(added.alternativeBadge).toBe('Alternativa');
      expect(added.time).toBe('10:00');
      // el orden queda por hora: tren 08:00, alternativa 10:00, museo 16:00
      expect(events.map((e) => e.order)).toEqual([1, 2, 3]);
      expect(events[2].id).toBe(museum.id);
    });

    it('marca el incidente como resuelto', async () => {
      const { trip, train } = fixture;
      const altId = await reportAndGetAlternativeId();
      await c.mediator.selectAlternative(selection(trip.id, train.id, altId));

      const saved = await c.incidentRepository.findByTripId(trip.id);
      expect(saved).toHaveLength(1);
      expect(saved[0].resolved).toBe(true);
    });

    it('falla si la alternativa no existe y el incidente sigue abierto', async () => {
      const { trip, train } = fixture;
      await reportAndGetAlternativeId();

      await expect(c.mediator.selectAlternative(selection(trip.id, train.id, 'otra')))
        .rejects.toThrow(AlternativeNotFoundError);
      expect((await c.incidentRepository.findByTripId(trip.id))[0].resolved).toBe(false);
      expect(fixture.train.status).toBe(EventStatus.ISSUE);
    });

    it('no se puede elegir dos veces la misma alternativa', async () => {
      const { trip, train } = fixture;
      const altId = await reportAndGetAlternativeId();
      await c.mediator.selectAlternative(selection(trip.id, train.id, altId));

      await expect(c.mediator.selectAlternative(selection(trip.id, train.id, altId)))
        .rejects.toThrow(AlternativeNotFoundError);
    });

    it('falla si el viaje no existe', async () => {
      await expect(c.mediator.selectAlternative(selection('no-existe', 'e', 'a')))
        .rejects.toThrow(TripNotFoundError);
    });
  });
});
