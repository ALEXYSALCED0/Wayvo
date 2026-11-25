// Opciones de los casos de uso de disponibilidad y reserva.
export interface ReservationOptions {
  // Modo demo: si una oferta tiene menos cupo del pedido, se le suman cupos
  // automáticamente para que las ofertas generadas por la IA no se agoten.
  // Con false se ve el comportamiento real ("sin cupo" → la Saga compensa).
  // Se configura con la variable de entorno DEMO_AUTO_REFILL_CAPACITY.
  autoRefillCapacity?: boolean;
}
