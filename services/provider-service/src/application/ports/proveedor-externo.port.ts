// TARGET del patrón Adapter

// ProviderService (Cliente) solo conoce esta interfaz. Cada API externa real (vuelos, hoteles, etc)
// queda detrás de un Adapter que la implementa y lo traduce al formato propio del proveedor

export interface DisponibilidadQuery {
  offerId: string;
  date?: string;
  quantity: number;
  metadata?: Record<string, unknown>;
}

export interface DisponibilidadResultado {
  available: boolean;
  remainingUnits?: number;
  unitPrice?: number;
  reason?: string;
}

export interface ReservaDatos {
  bookingId: string;
  offerId: string;
  quantity: number;
  customerName?: string;
  customerEmail?: string;
  metadata?: Record<string, unknown>;
}

export interface ConfirmacionResultado {
  success: boolean;
  confirmationCode?: string;
  reservationCode?: string;
  reason?: string;
  expiresAt?: string;
}

export interface IProveedorExterno {
  // Consulta cupo en el proveedor. Si no hay devuelve available=false con reason
  consultarDisponibilidad(criterios: DisponibilidadQuery): Promise<DisponibilidadResultado>;

  // Confirma la reserva en el proveedor. Si la rechaza devuelve success=false con reason
  confirmarReserva(datos: ReservaDatos): Promise<ConfirmacionResultado>;
}
