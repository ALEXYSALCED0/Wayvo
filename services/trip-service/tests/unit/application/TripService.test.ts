import { describe, expect, it } from 'vitest';
import { TripService } from '../../../src/application/services/TripService';
import { TripStatus } from '../../../src/domain/enums';
import { InvalidTripStateError, TripNotFoundError } from '../../../src/domain/errors';
import { InMemoryTripRepository } from '../../../src/infrastructure/persistence/InMemoryTripRepository';
import { makeTrip } from '../domain/helpers';

async function setup() {
  const repository = new InMemoryTripRepository();
  const service = new TripService(repository);
  const trip = makeTrip();
  await repository.save(trip);
  return { service, trip };
}

describe('TripService: confirmar y cancelar', () => {
  it('confirma un viaje en PENDING', async () => {
    const { service, trip } = await setup();

    const confirmed = await service.confirmTrip(trip.id);

    expect(confirmed.status).toBe(TripStatus.CONFIRMED);
  });

  it('cancela un viaje confirmado (compensación de la Saga)', async () => {
    const { service, trip } = await setup();
    await service.confirmTrip(trip.id);

    const cancelled = await service.cancelTrip(trip.id);

    expect(cancelled.status).toBe(TripStatus.CANCELLED);
  });

  it('cancelar dos veces no falla (la Saga puede reintentar)', async () => {
    const { service, trip } = await setup();
    await service.cancelTrip(trip.id);

    const again = await service.cancelTrip(trip.id);

    expect(again.status).toBe(TripStatus.CANCELLED);
  });

  it('no permite confirmar un viaje cancelado', async () => {
    const { service, trip } = await setup();
    await service.cancelTrip(trip.id);

    await expect(service.confirmTrip(trip.id)).rejects.toThrow(InvalidTripStateError);
  });

  it('falla si el viaje no existe', async () => {
    const { service } = await setup();

    await expect(service.confirmTrip('no-existe')).rejects.toThrow(TripNotFoundError);
  });
});
