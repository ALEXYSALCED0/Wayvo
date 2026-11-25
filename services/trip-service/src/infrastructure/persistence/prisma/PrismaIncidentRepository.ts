import { IIncidentRepository } from '../../../application/ports/IIncidentRepository';
import { IncidentEvent } from '../../../domain/entities/IncidentEvent';
import { PrismaClient } from './prisma.client';
import { TripMapper } from './trip.mapper';

// Implementación real del puerto IIncidentRepository sobre PostgreSQL (Trip DB).
export class PrismaIncidentRepository implements IIncidentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(incident: IncidentEvent): Promise<void> {
    const data = {
      tripId: incident.tripId,
      eventId: incident.eventId,
      type: incident.type,
      reason: incident.reason,
      occurredAt: incident.occurredAt,
      resolved: incident.resolved,
    };
    await this.prisma.incident.upsert({
      where: { id: incident.id },
      create: { id: incident.id, ...data },
      update: data,
    });
  }

  async findByTripId(tripId: string): Promise<IncidentEvent[]> {
    const rows = await this.prisma.incident.findMany({
      where: { tripId },
      orderBy: { occurredAt: 'asc' },
    });
    return rows.map((row) => TripMapper.incidentToDomain(row));
  }
}
