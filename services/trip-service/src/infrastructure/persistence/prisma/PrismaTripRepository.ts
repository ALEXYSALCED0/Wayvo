import { ITripRepository } from '../../../application/ports/ITripRepository';
import { Trip } from '../../../domain/entities/Trip';
import { PrismaClient } from './prisma.client';
import { TripMapper } from './trip.mapper';

// Implementación real del puerto ITripRepository sobre PostgreSQL (Trip DB).
// Los servicios de aplicación no cambian: solo dependen de la interfaz.
export class PrismaTripRepository implements ITripRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // Trip es la raíz del agregado: se guarda completo (viaje + eventos) en una
  // sola transacción, para que nunca quede un itinerario a medio escribir.
  async save(trip: Trip): Promise<void> {
    const { id, ...tripData } = TripMapper.toTripData(trip);
    const events = trip.events.map((e) => TripMapper.toEventData(e));

    await this.prisma.$transaction([
      this.prisma.trip.upsert({
        where: { id },
        create: { id, ...tripData },
        update: tripData,
      }),
      this.prisma.tripEvent.deleteMany({ where: { tripId: id } }),
      this.prisma.tripEvent.createMany({ data: events }),
    ]);
  }

  async findById(id: string): Promise<Trip | null> {
    const row = await this.prisma.trip.findUnique({
      where: { id },
      include: { events: true },
    });
    return row ? TripMapper.toDomain(row) : null;
  }

  async findByUserId(userId: string): Promise<Trip[]> {
    const rows = await this.prisma.trip.findMany({
      where: { userId },
      include: { events: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => TripMapper.toDomain(row));
  }

  async delete(id: string): Promise<boolean> {
    // Los eventos se borran en cascada (onDelete: Cascade en el esquema).
    const { count } = await this.prisma.trip.deleteMany({ where: { id } });
    return count > 0;
  }
}
