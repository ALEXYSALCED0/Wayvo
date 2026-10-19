import request from 'supertest';
import { HttpClient, HttpGatewayError } from '../../../src/adapters/gateways/http/http-client';
import { HttpProviderServiceGateway } from '../../../src/adapters/gateways/http/http-provider-service.gateway';
import { HttpTripServiceGateway } from '../../../src/adapters/gateways/http/http-trip-service.gateway';
import { loadConfig } from '../../../src/infrastructure/config/env';
import { buildContainer } from '../../../src/infrastructure/container';
import { createApp } from '../../../src/infrastructure/http/app';
import { InMemoryBookingRepository } from '../../../src/infrastructure/persistence/in-memory-booking.repository';
import { InMemoryCompensationLogRepository } from '../../../src/infrastructure/persistence/in-memory-compensation-log.repository';
import { BookingItemType } from '../../../src/domain/value-objects/booking-item-type';
import { createBookingInput, silentLogger } from '../../unit/application/helpers';
import { MockServices, startMockServices } from './mock-services';

describe('Adapters HTTP hacia trip-service y provider-service', () => {
  let mocks: MockServices;

  beforeAll(async () => {
    mocks = await startMockServices();
  });

  afterAll(async () => {
    await mocks.close();
  });

  beforeEach(() => {
    mocks.setProviderMode('ok');
    mocks.receivedCorrelationIds.length = 0;
  });

  const trips = () =>
    new HttpTripServiceGateway(new HttpClient({ service: 'trip-service', baseUrl: mocks.tripUrl, timeoutMs: 1000 }));
  const providers = (timeoutMs = 1000) =>
    new HttpProviderServiceGateway(
      new HttpClient({ service: 'provider-service', baseUrl: mocks.providerUrl, timeoutMs }),
    );
  const reservation = {
    bookingId: 'b-1',
    items: [{ type: BookingItemType.ACCOMMODATION, providerId: 'p', offerId: 'o', quantity: 1 }],
  };

  it('trip gateway crea, confirma y cancela, enviando el X-Correlation-Id', async () => {
    const gateway = trips();
    const { tripId } = await gateway.createPendingTrip(
      { userId: 'u', destination: 'Cartagena', startDate: '2026-12-01', endDate: '2026-12-03' },
      'corr-x',
    );
    await gateway.confirmTrip(tripId, 'corr-x');
    expect(mocks.tripStatus.get(tripId)).toBe('CONFIRMED');
    await gateway.cancelTrip(tripId, 'test', 'corr-x');
    expect(mocks.tripStatus.get(tripId)).toBe('CANCELLED');
    expect(mocks.receivedCorrelationIds).toEqual(['corr-x', 'corr-x', 'corr-x']);
  });

  it('provider gateway devuelve el código de reserva cuando hay cupo', async () => {
    expect(await providers().reserve(reservation, 'c')).toEqual({ available: true, reservationCode: 'RSV-HTTP-1' });
  });

  it('provider gateway devuelve available=false cuando no hay cupo', async () => {
    mocks.setProviderMode('unavailable');
    expect(await providers().reserve(reservation, 'c')).toEqual({ available: false, reason: 'No rooms left' });
  });

  it('lanza HttpGatewayError si el servicio responde 5xx', async () => {
    mocks.setProviderMode('error');
    await expect(providers().reserve(reservation, 'c')).rejects.toThrow(HttpGatewayError);
  });

  it('lanza HttpGatewayError si el servicio tarda más que el timeout', async () => {
    mocks.setProviderMode('slow');
    await expect(providers(100).reserve(reservation, 'c')).rejects.toThrow(HttpGatewayError);
  });

  it('lanza HttpGatewayError si el servicio no está levantado', async () => {
    const down = new HttpTripServiceGateway(
      new HttpClient({ service: 'trip-service', baseUrl: 'http://127.0.0.1:1', timeoutMs: 500 }),
    );
    await expect(down.confirmTrip('t', 'c')).rejects.toThrow(HttpGatewayError);
  });

  describe('flujo completo por HTTP (booking-service real + servicios simulados)', () => {
    function app() {
      const config = loadConfig({
        SERVICES_MODE: 'http',
        TRIP_SERVICE_URL: mocks.tripUrl,
        PROVIDER_SERVICE_URL: mocks.providerUrl,
        HTTP_TIMEOUT_MS: '1000',
      });
      return createApp(
        buildContainer(config, silentLogger, {
          bookings: new InMemoryBookingRepository(),
          compensationLogs: new InMemoryCompensationLogRepository(),
        }),
      );
    }

    const body = () => {
      const { userId, currency, items } = createBookingInput();
      return { userId, currency, items, trip: { destination: 'Cartagena', startDate: '2026-12-01', endDate: '2026-12-03' } };
    };

    it('confirma el viaje en trip-service', async () => {
      const res = await request(app()).post('/api/v1/saga/confirm-trip').set('X-Correlation-Id', 'e2e-ok').send(body());

      expect(res.status).toBe(201);
      expect(mocks.tripStatus.get(res.body.data.tripId)).toBe('CONFIRMED');
      expect(mocks.receivedCorrelationIds.every((id) => id === 'e2e-ok')).toBe(true);
    });

    it('si provider-service está caído, cancela el viaje en trip-service', async () => {
      mocks.setProviderMode('error');
      const res = await request(app()).post('/api/v1/saga/confirm-trip').send(body());

      expect(res.status).toBe(409);
      expect(res.body.error.details.reason).toContain('503');
      expect(mocks.tripStatus.get(res.body.error.details.tripId)).toBe('CANCELLED');
    });
  });
});