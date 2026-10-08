import { describe, expect, it } from 'vitest';
import { IncidentEvent } from '../../../src/domain/entities/IncidentEvent';
import { IssueType } from '../../../src/domain/enums';

describe('IncidentEvent', () => {
  it('nace sin resolver y se puede marcar como resuelto', () => {
    const incident = new IncidentEvent('trip-1', 'event-1', IssueType.MISSED, 'Perdí el tren');
    expect(incident.resolved).toBe(false);
    expect(incident.reason).toBe('Perdí el tren');
    incident.markResolved();
    expect(incident.resolved).toBe(true);
  });
});
