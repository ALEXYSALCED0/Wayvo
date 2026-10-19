import { CheckAvailabilityItemInput } from './availability.dto';

export interface ConfirmReservationInput {
  bookingId: string;
  items: CheckAvailabilityItemInput[];
  correlationId?: string;
}

export interface ConfirmedItem {
  offerId: string;
  providerId: string;
  quantity: number;
  // Códigos que devolvió el proveedor externo
  reservationCode?: string;
  confirmationCode?: string;
}

export interface ConfirmReservationOutput {
  bookingId: string;
  // Código de la reserva en Wayvo para toda la solicitud
  reservationCode: string;
  // Códigos de confirmación de los proveedores, separados por coma
  confirmationCode?: string;
  confirmedAt: string;
  items: ConfirmedItem[];
}
