import {
  ConfirmacionResultado,
  DisponibilidadQuery,
  DisponibilidadResultado,
  IProveedorExterno,
  ReservaDatos,
} from '../../application/ports/proveedor-externo.port';

/**
 * Adapter para actividades y experiencias turísticas (GoF Adapter Pattern).
 * Permite consultar disponibilidad y confirmar reservas para tours, guías y actividades.
 */
export class ActividadAdapter implements IProveedorExterno {
  async consultarDisponibilidad(criterios: DisponibilidadQuery): Promise<DisponibilidadResultado> {
    return {
      available: true,
      remainingUnits: Math.max(20, criterios.quantity * 2),
      reason: undefined,
    };
  }

  async confirmarReserva(datos: ReservaDatos): Promise<ConfirmacionResultado> {
    const code = `ACT-${datos.bookingId.slice(0, 8).toUpperCase()}`;
    return {
      success: true,
      confirmationCode: code,
      reservationCode: `RES-${code}`,
    };
  }
}
