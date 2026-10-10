import { beforeEach, describe, expect, it } from 'vitest';
import { AdapterMappingError, ExternalProviderError } from '../../../src/adapters/external/errors';
import { TransporteAdapter } from '../../../src/adapters/external/transporte.adapter';
import { IProveedorExterno } from '../../../src/application/ports/proveedor-externo.port';
import { FakeTransporteApi, flight, flightMetadata } from './fakes';

describe('TransporteAdapter', () => {
  let api: FakeTransporteApi;
  let adapter: IProveedorExterno;

  beforeEach(() => {
    api = new FakeTransporteApi();
    adapter = new TransporteAdapter(api);
  });

  describe('consultarDisponibilidad', () => {
    it('traduce la consulta de Wayvo a buscarVuelos', async () => {
      await adapter.consultarDisponibilidad({
        offerId: 'offer-1',
        quantity: 2,
        metadata: { ...flightMetadata, cabinClass: 'business' },
      });

      expect(api.searches).toEqual([
        {
          originAirport: 'BAQ',
          destinationAirport: 'CTG',
          departureDate: '2026-12-01',
          passengers: 2,
          cabinClass: 'business',
        },
      ]);
    });

    it('traduce la respuesta del proveedor al modelo de Wayvo', async () => {
      const result = await adapter.consultarDisponibilidad({ offerId: 'offer-1', quantity: 2, metadata: flightMetadata });

      expect(result).toEqual({ available: true, remainingUnits: 20, unitPrice: 320000 });
    });

    it('elige el vuelo de la oferta entre todos los de la ruta', async () => {
      api.flights = [flight({ flightNumber: 'XX999', seatsAvailable: 1 }), flight({ flightNumber: 'AV123', seatsAvailable: 7 })];

      const result = await adapter.consultarDisponibilidad({ offerId: 'offer-1', quantity: 2, metadata: flightMetadata });

      expect(result.remainingUnits).toBe(7);
    });

    it('usa la fecha de la consulta si la oferta no trae departureDate', async () => {
      const { departureDate: _omit, ...withoutDate } = flightMetadata;

      await adapter.consultarDisponibilidad({ offerId: 'offer-1', quantity: 1, date: '2026-12-05', metadata: withoutDate });

      expect(api.searches[0].departureDate).toBe('2026-12-05');
    });

    it('available=false con los asientos que quedan si no alcanzan', async () => {
      api.flights = [flight({ seatsAvailable: 1 })];

      const result = await adapter.consultarDisponibilidad({ offerId: 'offer-1', quantity: 3, metadata: flightMetadata });

      expect(result).toMatchObject({ available: false, remainingUnits: 1, unitPrice: 320000 });
      expect(result.reason).toMatch(/Only 1 seats left.*requested 3/);
    });

    it('available=false si el vuelo ya no aparece en la búsqueda', async () => {
      api.flights = [];

      const result = await adapter.consultarDisponibilidad({ offerId: 'offer-1', quantity: 1, metadata: flightMetadata });

      expect(result).toMatchObject({ available: false, remainingUnits: 0 });
      expect(result.reason).toMatch(/AV123 not found/);
    });

    it('falla con AdapterMappingError si a la oferta le faltan datos, sin llamar a la API', async () => {
      const { flightNumber: _omit, ...incomplete } = flightMetadata;

      await expect(
        adapter.consultarDisponibilidad({ offerId: 'offer-1', quantity: 1, metadata: incomplete }),
      ).rejects.toThrow(AdapterMappingError);
      await expect(adapter.consultarDisponibilidad({ offerId: 'offer-1', quantity: 1 })).rejects.toThrow(/metadata\.originAirport/);
      expect(api.searches).toHaveLength(0);
    });

    it('rechaza una cabinClass inválida', async () => {
      await expect(
        adapter.consultarDisponibilidad({ offerId: 'offer-1', quantity: 1, metadata: { ...flightMetadata, cabinClass: 'vip' } }),
      ).rejects.toThrow(AdapterMappingError);
    });

    it('traduce una falla de la API a ExternalProviderError conservando la causa', async () => {
      api.failWith = new Error('ECONNRESET');

      const error = await adapter
        .consultarDisponibilidad({ offerId: 'offer-1', quantity: 1, metadata: flightMetadata })
        .catch((e) => e);

      expect(error).toBeInstanceOf(ExternalProviderError);
      expect(error.provider).toBe('transporte');
      expect(error.message).toMatch(/buscarVuelos.*ECONNRESET/);
      expect(error.cause).toBe(api.failWith);
    });
  });

  describe('confirmarReserva', () => {
    it('traduce la reserva de Wayvo a reservarVuelo', async () => {
      await adapter.confirmarReserva({
        bookingId: 'booking-1',
        offerId: 'offer-1',
        quantity: 2,
        customerName: 'Ana Pérez',
        customerEmail: 'ana@mail.com',
        metadata: flightMetadata,
      });

      expect(api.bookings).toEqual([
        {
          flightNumber: 'AV123',
          departureDate: '2026-12-01',
          passengers: 2,
          passengerName: 'Ana Pérez',
          passengerEmail: 'ana@mail.com',
          reference: 'booking-1',
        },
      ]);
    });

    it('traduce una reserva confirmada: pnr -> reservationCode, ticket -> confirmationCode', async () => {
      const result = await adapter.confirmarReserva({ bookingId: 'b1', offerId: 'o1', quantity: 1, metadata: flightMetadata });

      expect(result).toEqual({ success: true, reservationCode: 'PNR123', confirmationCode: 'TKT456' });
    });

    it('devuelve success=false con el motivo si el proveedor la rechaza', async () => {
      api.bookingResult = { pnr: '', status: 'REJECTED', reason: 'Tarifa agotada' };

      const result = await adapter.confirmarReserva({ bookingId: 'b1', offerId: 'o1', quantity: 1, metadata: flightMetadata });

      expect(result).toEqual({ success: false, reason: 'Tarifa agotada' });
    });

    it('falla con AdapterMappingError si falta el número de vuelo, sin llamar a la API', async () => {
      const { flightNumber: _omit, ...incomplete } = flightMetadata;

      await expect(
        adapter.confirmarReserva({ bookingId: 'b1', offerId: 'o1', quantity: 1, metadata: incomplete }),
      ).rejects.toThrow(AdapterMappingError);
      expect(api.bookings).toHaveLength(0);
    });

    it('traduce una falla de la API a ExternalProviderError', async () => {
      api.failWith = new Error('timeout');

      await expect(
        adapter.confirmarReserva({ bookingId: 'b1', offerId: 'o1', quantity: 1, metadata: flightMetadata }),
      ).rejects.toThrow(ExternalProviderError);
    });
  });
});

describe('TransporteAdapter con una API que no informa asientos', () => {
  it('si el vuelo aparece, está disponible aunque no haya seatsAvailable', async () => {
    const api = new FakeTransporteApi();
    api.flights = [flight({ seatsAvailable: undefined })];

    const result = await new TransporteAdapter(api).consultarDisponibilidad({
      offerId: 'o1', quantity: 5, metadata: flightMetadata,
    });

    expect(result).toEqual({ available: true, remainingUnits: undefined, unitPrice: 320000 });
  });

  it('compara el número de vuelo sin importar espacios ni mayúsculas', async () => {
    const api = new FakeTransporteApi();
    api.flights = [flight({ flightNumber: 'AA 787' })];

    const result = await new TransporteAdapter(api).consultarDisponibilidad({
      offerId: 'o1', quantity: 1, metadata: { ...flightMetadata, flightNumber: 'aa787' },
    });

    expect(result.available).toBe(true);
  });
});
