import { PrismaClient } from '@prisma/client';
import { Booking } from '../../../domain/entities/booking';
import { BookingRepository } from '../../../domain/repositories/booking.repository';
import { BookingMapper } from './booking.mapper';

export class PrismaBookingRepository implements BookingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(booking: Booking): Promise<void> {
    await this.prisma.booking.upsert({
      where: { id: booking.id },
      create: BookingMapper.toCreateInput(booking),
      update: BookingMapper.toUpdateInput(booking),
    });
  }

  async findById(id: string): Promise<Booking | null> {
    const row = await this.prisma.booking.findUnique({
      where: { id },
      include: { items: true },
    });
    return row ? BookingMapper.toDomain(row) : null;
  }
}