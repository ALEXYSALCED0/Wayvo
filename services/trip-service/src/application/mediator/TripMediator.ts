import type {
  TripMediatorIncidentInput,
  TripMediatorIncidentResult,
  TripMediatorSelectAlternativeInput,
  TripMediatorSelectAlternativeResult,
} from '@wayvo/contracts';
import {
  toAlternativeDTO, toDomainIssueType, toEventDTO, toTripDTO,
} from '../mappers/TripMapper';
import { AlternativeService } from '../services/AlternativeService';
import { EventService } from '../services/EventService';
import { TripService } from '../services/TripService';
import { IMediator } from './IMediator';


// EventService, AlternativeService y TripService no se llaman entre sí.
export class TripMediator implements IMediator {
  constructor(
    private readonly eventService: EventService,
    private readonly alternativeService: AlternativeService,
    private readonly tripService: TripService,
  ) {}

  // Paso 1: el usuario reporta un problema en un evento.
  async reportIncident(input: TripMediatorIncidentInput): Promise<TripMediatorIncidentResult> {
    const type = toDomainIssueType(input.type);

    // 1. Buscar el viaje y el evento afectado (falla si alguno no existe)
    const trip = await this.tripService.getTrip(input.tripId);
    const event = trip.getEvent(input.eventId);

    // 2. AlternativeService propone las opciones de cambio
    const alternatives = this.alternativeService.generate(type, event);

    // 3. TripService deja el evento en ISSUE con esas opciones.
    //    Va antes del registro: si el viaje lo rechaza, no queda un incidente huérfano.
    const result = await this.tripService.reportIssue(
      input.tripId, input.eventId, type, input.reason, alternatives,
    );

    // 4. EventService registra el incidente
    await this.eventService.register(input.tripId, input.eventId, type, input.reason);

    return {
      affectedEvent: toEventDTO(result.event),
      alternatives: alternatives.map(toAlternativeDTO),
      updatedTrip: toTripDTO(result.trip),
    };
  }

  // Paso 2: el usuario elige una de las alternativas propuestas.
  async selectAlternative(
    input: TripMediatorSelectAlternativeInput,
  ): Promise<TripMediatorSelectAlternativeResult> {
    // 1. TripService cancela el evento afectado y mete los eventos nuevos al itinerario
    const { trip, selected } = await this.tripService.selectAlternative(
      input.tripId, input.eventId, input.alternativeId,
    );

    // 2. EventService marca el incidente como resuelto
    await this.eventService.resolve(input.tripId, input.eventId);

    return {
      selectedAlternative: toAlternativeDTO(selected),
      updatedTrip: toTripDTO(trip),
    };
  }
}
