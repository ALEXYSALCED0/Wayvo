import type { TripMediatorIncidentInput } from '@wayvo/contracts';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { IncidentEvent } from '../../../src/domain/entities/IncidentEvent';
import { EventStatus, IssueType, TripStatus } from '../../../src/domain/enums';
import { buildContainer } from '../../../src/infrastructure/container';
import { createPrismaClient } from '../../../src/infrastructure/persistence/prisma/prisma.client';
import { PrismaIncidentRepository } from '../../../src/infrastructure/persistence/prisma/PrismaIncidentRepository';
import { PrismaTripRepository } from '../../../src/infrastructure/persistence/prisma/PrismaTripRepository';
import { makeTripWithEvents } from '../../unit/domain/helpers';

// Estos tests usan una base de datos real. Solo corren si existe TEST_DATABASE_URL, p. ej.:
//   docker compose up -d trip-db
//   npx prisma migrate deploy   (con DATABASE_URL apuntando a la misma base)
//   TEST_DATABASE_URL="postgresql://wayvo:wayvo@localhost:5435/trip_db?schema=public" npx vitest run
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('Repositorios Prisma de trip-service (PostgreSQL real)', () => {
  const prisma = url ? createPrismaClient(url) : (null as never);
  const trips = url ? new PrismaTripRepository(prisma) : (null as never);
  const incidents = url ? new PrismaIncidentRepository(prisma) : (null as never);

  beforeEach(async () => {
    await prisma.incident.deleteMany();
    await prisma.trip.deleteMany(); // los eventos caen en cascada
  });

  afterAll(async () => {
    await prisma.incident.deleteMany();
    await prisma.trip.deleteMany();
    await prisma.$disconnect();
  });

  it('guarda un viaje con sus eventos y lo reconstruye igual', async () => {
    const { trip, train, museum } = makeTripWithEvents();
    await trips.save(trip);

    const loaded = await trips.findById(trip.id);

    expect(loaded).not.toBeNull();
    expect(loaded!.userId).toBe('u1');
    expect(loaded!.status).toBe(TripStatus.PENDING);
    expect(loaded!.events.map((e) => e.id)).toEqual([train.id, museum.id]);
    expect(loaded!.events[0].startDateTime.toISOString()).toBe(train.startDateTime.toISOString());
  });

  it('actualiza el agregado completo al volver a guardarlo', async () => {
    const { trip, train } = makeTripWithEvents();
    await trips.save(trip);

    trip.changeStatus(TripStatus.CONFIRMED);
    trip.cancelEvent(train.id, 'Cambio de planes');
    await trips.save(trip);

    const loaded = await trips.findById(trip.id);
    expect(loaded!.status).toBe(TripStatus.CONFIRMED);
    expect(loaded!.getEvent(train.id).status).toBe(EventStatus.CANCELLED);
    expect(loaded!.events).toHaveLength(2);
  });

  it('lista solo los viajes del usuario indicado', async () => {
    const a = makeTripWithEvents().trip;
    const b = makeTripWithEvents().trip;
    await trips.save(a);
    await trips.save(b);

    expect(await trips.findByUserId('u1')).toHaveLength(2);
    expect(await trips.findByUserId('otro-usuario')).toHaveLength(0);
  });

  it('elimina el viaje y sus eventos', async () => {
    const { trip } = makeTripWithEvents();
    await trips.save(trip);

    expect(await trips.delete(trip.id)).toBe(true);
    expect(await trips.findById(trip.id)).toBeNull();
    expect(await prisma.tripEvent.count({ where: { tripId: trip.id } })).toBe(0);
    expect(await trips.delete(trip.id)).toBe(false);
  });

  it('persiste incidentes y su estado de resolución', async () => {
    const { trip, train } = makeTripWithEvents();
    await trips.save(trip);
    const incident = new IncidentEvent(trip.id, train.id, IssueType.MISSED, 'Perdí el tren');
    await incidents.save(incident);

    incident.markResolved();
    await incidents.save(incident);

    const [loaded] = await incidents.findByTripId(trip.id);
    expect(loaded.id).toBe(incident.id);
    expect(loaded.resolved).toBe(true);
  });

  it('el Mediator funciona igual sobre PostgreSQL (alternativas guardadas como JSON)', async () => {
    const c = buildContainer(url);
    const { trip, train } = makeTripWithEvents();
    await c.tripRepository.save(trip);

    const input: TripMediatorIncidentInput = {
      tripId: trip.id, eventId: train.id, type: IssueType.MISSED as TripMediatorIncidentInput['type'], reason: 'Perdí el tren',
    };
    const reported = await c.mediator.reportIncident(input);
    const alternativeId = reported.alternatives[0].id;

    // Se relee desde la BD: la alternativa debe seguir existiendo para poder elegirla.
    const result = await c.mediator.selectAlternative({ tripId: trip.id, eventId: train.id, alternativeId });

    const loaded = await c.tripRepository.findById(trip.id);
    expect(result).toBeDefined();
    expect(loaded!.getEvent(train.id).status).toBe(EventStatus.CANCELLED);
    expect(loaded!.events.some((e) => e.isAlternative)).toBe(true);
  });
});
