// Liberación de cupos: compensación de la Saga cuando falla un paso posterior
// a la reserva (por ejemplo, el pago fue rechazado).

export interface ReleaseItemInput {
  offerId: string;
  quantity: number;
}

export interface ReleaseReservationInput {
  bookingId: string;
  items: ReleaseItemInput[];
  correlationId?: string;
}

export interface ReleasedItem {
  offerId: string;
  quantity: number;
  // false si no se pudo devolver (ej. la oferta no existe); la compensación
  // sigue con el resto en vez de abortar.
  released: boolean;
  reason?: string;
}

export interface ReleaseReservationOutput {
  bookingId: string;
  releasedAt: string;
  items: ReleasedItem[];
}
