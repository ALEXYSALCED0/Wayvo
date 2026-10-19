import { Booking } from '../entities/booking';

// Puerto de salida: el dominio dice QUÉ necesita; Prisma (feature 5) dirá CÓMO.
export interface BookingRepository {
  save(booking: Booking): Promise<void>;
  findById(id: string): Promise<Booking | null>;
}