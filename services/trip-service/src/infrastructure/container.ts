import { IMediator } from '../application/mediator/IMediator';
import { TripMediator } from '../application/mediator/TripMediator';
import { AlternativeService } from '../application/services/AlternativeService';
import { EventService } from '../application/services/EventService';
import { TripService } from '../application/services/TripService';
import { InMemoryIncidentRepository } from './persistence/InMemoryIncidentRepository';
import { InMemoryTripRepository } from './persistence/InMemoryTripRepository';
import { TripController } from '../adapters/controllers/TripController';

// Al momento de utilizar una base de datos real, solo se cambian los repositorios de este archivo.
export function buildContainer() {
  const tripRepository = new InMemoryTripRepository();
  const incidentRepository = new InMemoryIncidentRepository();

  const tripService = new TripService(tripRepository);
  const eventService = new EventService(incidentRepository);
  const alternativeService = new AlternativeService();

  const mediator: IMediator = new TripMediator(eventService, alternativeService, tripService);
  const tripController = new TripController(tripService);

  return { mediator, tripService, tripController, tripRepository, incidentRepository };
}
