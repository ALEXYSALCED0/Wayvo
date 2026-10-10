import {
  ConfirmacionResultado,
  DisponibilidadQuery,
  DisponibilidadResultado,
  IProveedorExterno,
  ReservaDatos,
} from '../../application/ports/proveedor-externo.port';
import { AlojamientoAPIExterna } from './alojamiento-api-externa';
import { callExternal } from './call-external';
import { optionalPositiveInt, optionalString, requireString } from './metadata';

const PROVIDER = 'alojamiento';

interface StayRef {
  cityCode: string;
  hotelCode: string;
  checkInDate: string;
  checkOutDate: string;
  roomType?: string;
  guests?: number;
}

// ADAPTER hace que la API de hoteles parezca un IProveedorExterno.
// Traduce "consultarDisponibilidad / confirmarReserva" a "buscarHoteles / reservarHabitacion"
// La oferta (ServiceOffer) representa una habitación
export class AlojamientoAdapter implements IProveedorExterno {
  constructor(private readonly api: AlojamientoAPIExterna) {}

  async consultarDisponibilidad(criterios: DisponibilidadQuery): Promise<DisponibilidadResultado> {
    const ref = this.readRef(criterios.metadata, criterios.offerId, criterios.date);

    const hotels = await callExternal(PROVIDER, 'buscarHoteles', () =>
      this.api.buscarHoteles({
        cityCode: ref.cityCode,
        checkInDate: ref.checkInDate,
        checkOutDate: ref.checkOutDate,
        guests: ref.guests ?? criterios.quantity, // si no se indica, se asume un huésped por habitación
        roomType: ref.roomType,
      }),
    );

    // La API devuelve todos los hoteles de la ciudad, se queda el de la oferta
    const hotel = hotels.find((h) => h.hotelCode === ref.hotelCode);
    if (!hotel) {
      return {
        available: false,
        remainingUnits: 0,
        reason: `Hotel ${ref.hotelCode} not found in ${ref.cityCode} for ${ref.checkInDate} - ${ref.checkOutDate}`,
      };
    }
    // Si no informa habitaciones pero el hotel aparece, se considera disponible
    if (hotel.roomsAvailable !== undefined && hotel.roomsAvailable < criterios.quantity) {
      return {
        available: false,
        remainingUnits: hotel.roomsAvailable,
        unitPrice: hotel.nightlyRate,
        reason: `Only ${hotel.roomsAvailable} rooms left at ${hotel.hotelName}, requested ${criterios.quantity}`,
      };
    }
    return { available: true, remainingUnits: hotel.roomsAvailable, unitPrice: hotel.nightlyRate };
  }

  async confirmarReserva(datos: ReservaDatos): Promise<ConfirmacionResultado> {
    const ref = this.readRef(datos.metadata, datos.offerId);

    const result = await callExternal(PROVIDER, 'reservarHabitacion', () =>
      this.api.reservarHabitacion({
        hotelCode: ref.hotelCode,
        roomType: ref.roomType,
        checkInDate: ref.checkInDate,
        checkOutDate: ref.checkOutDate,
        rooms: datos.quantity,
        guestName: datos.customerName,
        guestEmail: datos.customerEmail,
        reference: datos.bookingId,
      }),
    );

    if (result.status !== 'CONFIRMED') {
      return { success: false, reason: result.reason ?? 'Room booking rejected by the provider' };
    }
    return { success: true, reservationCode: result.bookingRef };
  }

  private readRef(metadata: Record<string, unknown> | undefined, offerId: string, date?: string): StayRef {
    return {
      cityCode: requireString(metadata, 'cityCode', offerId),
      hotelCode: requireString(metadata, 'hotelCode', offerId),
      checkInDate: requireString(metadata, 'checkInDate', offerId, date),
      checkOutDate: requireString(metadata, 'checkOutDate', offerId),
      roomType: optionalString(metadata, 'roomType', offerId),
      guests: optionalPositiveInt(metadata, 'guests', offerId),
    };
  }
}
