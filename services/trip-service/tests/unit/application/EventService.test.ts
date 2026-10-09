import { beforeEach, describe, expect, it } from 'vitest';
import { IssueType } from '../../../src/domain/enums';
import { EventService } from '../../../src/application/services/EventService';
import { InMemoryIncidentRepository } from '../../../src/infrastructure/persistence/InMemoryIncidentRepository';

describe('EventService', () => {
  let repo: InMemoryIncidentRepository;
  let service: EventService;

  beforeEach(() => {
    repo = new InMemoryIncidentRepository();
    service = new EventService(repo);
  });

  it('registra un incidente sin resolver', async () => {
    const incident = await service.register('trip-1', 'event-1', IssueType.MISSED, 'Perdí el tren');
    expect(incident.resolved).toBe(false);
    expect(await repo.findByTripId('trip-1')).toHaveLength(1);
  });

  it('resuelve solo el incidente del evento indicado', async () => {
    await service.register('trip-1', 'event-1', IssueType.MISSED, 'a');
    await service.register('trip-1', 'event-2', IssueType.CANCELLED, 'b');

    await service.resolve('trip-1', 'event-1');

    const [first, second] = await repo.findByTripId('trip-1');
    expect(first.resolved).toBe(true);
    expect(second.resolved).toBe(false);
  });

  it('no falla si el evento no tiene incidentes abiertos', async () => {
    await expect(service.resolve('trip-1', 'nada')).resolves.toBeUndefined();
  });
});
