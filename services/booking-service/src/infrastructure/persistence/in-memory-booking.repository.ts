import { Booking } from '../../domain/entities/booking';
import { BookingRepository } from '../../domain/repositories/booking.repository';

// Implementación en memoria del puerto BookingRepository. Sirve para los tests
// y para correr el servicio antes de tener PostgreSQL (feature 5).
// Guarda copias para que nadie modifique una reserva "guardada" por referencia.
export class InMemoryBookingRepository implements BookingRepository {
  private readonly store = new Map<string, Booking>();

  async save(booking: Booking): Promise<void> {
    this.store.set(booking.id, this.clone(booking));
  }

  async findById(id: string): Promise<Booking | null> {
    const found = this.store.get(id);
    return found ? this.clone(found) : null;
  }

  private clone(booking: Booking): Booking {
    const { totalAmount: _total, items: _items, ...props } = booking.toPrimitives();
    return Booking.restore({ ...props, items: [...booking.items] });
  }
}