import { describe, expect, it } from 'vitest';
import {
  ConfirmacionResultado,
  DisponibilidadQuery,
  DisponibilidadResultado,
  IProveedorExterno,
  ReservaDatos,
} from '../../../src/application/ports/proveedor-externo.port';

// verificar que el Target se puede implementar como está definido, y que un cliente solo necesita conocer la interfaz
class FakeAdapter implements IProveedorExterno {
  async consultarDisponibilidad(c: DisponibilidadQuery): Promise<DisponibilidadResultado> {
    return { available: c.quantity <= 2, remainingUnits: 2 };
  }
  async confirmarReserva(d: ReservaDatos): Promise<ConfirmacionResultado> {
    return { success: true, reservationCode: `RES-${d.bookingId}` };
  }
}

describe('IProveedorExterno (Target del Adapter)', () => {
  it('permite que un cliente use cualquier implementación solo por la interfaz', async () => {
    const proveedor: IProveedorExterno = new FakeAdapter();
    expect((await proveedor.consultarDisponibilidad({ offerId: 'o1', quantity: 1 })).available).toBe(true);
    expect((await proveedor.consultarDisponibilidad({ offerId: 'o1', quantity: 5 })).available).toBe(false);
    expect((await proveedor.confirmarReserva({ bookingId: 'b1', offerId: 'o1', quantity: 1 })).reservationCode).toBe('RES-b1');
  });
});
