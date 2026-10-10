import { beforeEach, describe, expect, it } from 'vitest';
import { AlojamientoAdapter } from '../../../src/adapters/external/alojamiento.adapter';
import { AdapterMappingError, ExternalProviderError } from '../../../src/adapters/external/errors';
import { IProveedorExterno } from '../../../src/application/ports/proveedor-externo.port';
import { FakeAlojamientoApi, hotel, stayMetadata } from './fakes';

describe('AlojamientoAdapter', () => {
  let api: FakeAlojamientoApi;
  let adapter: IProveedorExterno;

  beforeEach(() => {
    api = new FakeAlojamientoApi();
    adapter = new AlojamientoAdapter(api);
  });

  describe('consultarDisponibilidad', () => {
    it('traduce la consulta de Wayvo a buscarHoteles', async () => {
      await adapter.consultarDisponibilidad({ offerId: 'offer-2', quantity: 2, metadata: stayMetadata });

      expect(api.searches).toEqual([
        { cityCode: 'CTG', checkInDate: '2026-12-01', checkOutDate: '2026-12-03', guests: 2, roomType: 'double' },
      ]);
    });

    it('usa guests de la metadata si viene', async () => {
      await adapter.consultarDisponibilidad({ offerId: 'offer-2', quantity: 1, metadata: { ...stayMetadata, guests: 4 } });

      expect(api.searches[0].guests).toBe(4);
    });

    it('traduce la respuesta del proveedor al modelo de Wayvo', async () => {
      const result = await adapter.consultarDisponibilidad({ offerId: 'offer-2', quantity: 2, metadata: stayMetadata });

      expect(result).toEqual({ available: true, remainingUnits: 5, unitPrice: 280000 });
    });

    it('elige el hotel de la oferta entre todos los de la ciudad', async () => {
      api.hotels = [hotel({ hotelCode: 'OTRO', roomsAvailable: 99 }), hotel({ roomsAvailable: 3 })];

      const result = await adapter.consultarDisponibilidad({ offerId: 'offer-2', quantity: 1, metadata: stayMetadata });

      expect(result.remainingUnits).toBe(3);
    });

    it('usa la fecha de la consulta como check-in si la oferta no lo trae', async () => {
      const { checkInDate: _omit, ...withoutCheckIn } = stayMetadata;

      await adapter.consultarDisponibilidad({ offerId: 'offer-2', quantity: 1, date: '2026-12-10', metadata: withoutCheckIn });

      expect(api.searches[0].checkInDate).toBe('2026-12-10');
    });

    it('available=false con las habitaciones que quedan si no alcanzan', async () => {
      api.hotels = [hotel({ roomsAvailable: 1 })];

      const result = await adapter.consultarDisponibilidad({ offerId: 'offer-2', quantity: 2, metadata: stayMetadata });

      expect(result).toMatchObject({ available: false, remainingUnits: 1, unitPrice: 280000 });
      expect(result.reason).toMatch(/Only 1 rooms left at Hotel Caribe, requested 2/);
    });

    it('available=false si el hotel no aparece en la búsqueda', async () => {
      api.hotels = [];

      const result = await adapter.consultarDisponibilidad({ offerId: 'offer-2', quantity: 1, metadata: stayMetadata });

      expect(result).toMatchObject({ available: false, remainingUnits: 0 });
      expect(result.reason).toMatch(/HTL-CTG-1 not found in CTG/);
    });

    it('falla con AdapterMappingError si faltan datos o son inválidos, sin llamar a la API', async () => {
      const { hotelCode: _omit, ...incomplete } = stayMetadata;

      await expect(
        adapter.consultarDisponibilidad({ offerId: 'offer-2', quantity: 1, metadata: incomplete }),
      ).rejects.toThrow(/metadata\.hotelCode/);
      await expect(
        adapter.consultarDisponibilidad({ offerId: 'offer-2', quantity: 1, metadata: { ...stayMetadata, guests: 0 } }),
      ).rejects.toThrow(AdapterMappingError);
      expect(api.searches).toHaveLength(0);
    });

    it('traduce una falla de la API a ExternalProviderError conservando la causa', async () => {
      api.failWith = new Error('503');

      const error = await adapter
        .consultarDisponibilidad({ offerId: 'offer-2', quantity: 1, metadata: stayMetadata })
        .catch((e) => e);

      expect(error).toBeInstanceOf(ExternalProviderError);
      expect(error.provider).toBe('alojamiento');
      expect(error.cause).toBe(api.failWith);
    });
  });

  describe('confirmarReserva', () => {
    it('traduce la reserva de Wayvo a reservarHabitacion', async () => {
      await adapter.confirmarReserva({
        bookingId: 'booking-1',
        offerId: 'offer-2',
        quantity: 2,
        customerName: 'Ana Pérez',
        customerEmail: 'ana@mail.com',
        metadata: stayMetadata,
      });

      expect(api.bookings).toEqual([
        {
          hotelCode: 'HTL-CTG-1',
          roomType: 'double',
          checkInDate: '2026-12-01',
          checkOutDate: '2026-12-03',
          rooms: 2,
          guestName: 'Ana Pérez',
          guestEmail: 'ana@mail.com',
          reference: 'booking-1',
        },
      ]);
    });

    it('traduce una reserva confirmada: bookingRef -> reservationCode', async () => {
      const result = await adapter.confirmarReserva({ bookingId: 'b1', offerId: 'o2', quantity: 1, metadata: stayMetadata });

      expect(result).toEqual({ success: true, reservationCode: 'HTL789' });
    });

    it('devuelve success=false con el motivo si el proveedor la rechaza', async () => {
      api.bookingResult = { bookingRef: '', status: 'REJECTED', reason: 'Sin habitaciones' };

      const result = await adapter.confirmarReserva({ bookingId: 'b1', offerId: 'o2', quantity: 1, metadata: stayMetadata });

      expect(result).toEqual({ success: false, reason: 'Sin habitaciones' });
    });

    it('traduce una falla de la API a ExternalProviderError', async () => {
      api.failWith = new Error('timeout');

      await expect(
        adapter.confirmarReserva({ bookingId: 'b1', offerId: 'o2', quantity: 1, metadata: stayMetadata }),
      ).rejects.toThrow(ExternalProviderError);
    });
  });
});

describe('AlojamientoAdapter con una API que no informa habitaciones ni tarifa', () => {
  it('si el hotel aparece, está disponible aunque no haya roomsAvailable', async () => {
    const api = new FakeAlojamientoApi();
    api.hotels = [hotel({ roomsAvailable: undefined, nightlyRate: undefined })];

    const result = await new AlojamientoAdapter(api).consultarDisponibilidad({
      offerId: 'o2', quantity: 3, metadata: stayMetadata,
    });

    expect(result.available).toBe(true);
    expect(result.unitPrice).toBeUndefined();
  });
});
