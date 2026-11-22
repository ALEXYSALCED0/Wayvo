import { IMediator } from '../application/mediator/IMediator';
import { TripMediator } from '../application/mediator/TripMediator';
import { IIncidentRepository } from '../application/ports/IIncidentRepository';
import { ITripRepository } from '../application/ports/ITripRepository';
import { AlternativeService } from '../application/services/AlternativeService';
import { EventService } from '../application/services/EventService';
import { TripService } from '../application/services/TripService';
import { InMemoryIncidentRepository } from './persistence/InMemoryIncidentRepository';
import { InMemoryTripRepository } from './persistence/InMemoryTripRepository';
import { createPrismaClient } from './persistence/prisma/prisma.client';
import { PrismaIncidentRepository } from './persistence/prisma/PrismaIncidentRepository';
import { PrismaTripRepository } from './persistence/prisma/PrismaTripRepository';
import { TripController } from '../adapters/controllers/TripController';

// Raíz de composición: aquí (y solo aquí) se decide qué implementación concreta
// recibe cada puerto. Con DATABASE_URL se usa PostgreSQL (Trip DB); sin ella,
// repositorios en memoria (útil para tests). El resto del servicio no cambia.
export function buildContainer(databaseUrl?: string | null) {
  let tripRepository: ITripRepository;
  let incidentRepository: IIncidentRepository;
  let persistence: 'postgres' | 'in-memory';

  if (databaseUrl) {
    const prisma = createPrismaClient(databaseUrl);
    tripRepository = new PrismaTripRepository(prisma);
    incidentRepository = new PrismaIncidentRepository(prisma);
    persistence = 'postgres';
  } else {
    tripRepository = new InMemoryTripRepository();
    incidentRepository = new InMemoryIncidentRepository();
    persistence = 'in-memory';
  }

  const tripService = new TripService(tripRepository);
  const eventService = new EventService(incidentRepository);
  const alternativeService = new AlternativeService();

  const mediator: IMediator = new TripMediator(eventService, alternativeService, tripService);
  const tripController = new TripController(tripService);

  return { mediator, tripService, tripController, tripRepository, incidentRepository, persistence };
}
