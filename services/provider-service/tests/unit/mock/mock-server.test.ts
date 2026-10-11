import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import express from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ExternalProviderError } from '../../../src/adapters/external/errors';
import { CheckAvailabilityUseCase } from '../../../src/application/use-cases/check-availability.use-case';
import { ServiceOfferType } from '../../../src/domain/value-objects/service-offer-type';
import { createExternalProviderRegistry } from '../../../src/infrastructure/external/external-providers.factory';
import { flightNumbersFor, hotelCodesFor } from '../../../src/infrastructure/mock/mock-inventory';
import { mountMockApi } from '../../../src/infrastructure/mock/mount-mock';
import { silentLogger } from '../application/helpers';
import { makeOffer, makeProvider } from '../domain/fixtures';
import { InMemoryProviderRepository } from '../../../src/infrastructure/persistence/in-memory-provider.repository';
import { InMemoryServiceOfferRepository } from '../../../src/infrastructure/persistence/in-memory-service-offer.repository';

// Servidor HTTP real con el simulador montado (latencia casi nula para que las pruebas sean rápidas)
let server: Server;
let base: string;
let env: Record<string, string | undefined>;

beforeAll(async () => {
  const app = express();
  mountMockApi(app, { NODE_ENV: 'test' }, undefined, { latency: { minMs: 0, maxMs: 0 } });
  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  env = { EXTERNAL_PROVIDERS_MODE: 'mock', MOCK_API_BASE_URL: `${base}/api/v1/mock/external`, EXTERNAL_API_TIMEOUT_MS: '1500' };
});
afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));
beforeEach(async () => {
  await fetch(`${base}/api/v1/mock/reset`, { method: 'POST' });
});

const simulate = (query: string) => fetch(`${base}/api/v1/mock/simulate-failure${query}`);

describe('GET /simulate-failure', () => {
  it('sin parámetros muestra el estado', async () => {
    const res = await simulate('');
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true, data: { activeMode: 'normal' } });
  });

  it('cambia el modo a unavailable', async () => {
    const res = await simulate('?mode=unavailable');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.activeMode).toBe('unavailable');
    expect((await (await simulate('')).json()).data.activeMode).toBe('unavailable');
  });

  it('modo inválido: 400 con ApiResponse de error', async () => {
    const res = await simulate('?mode=explode');
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      success: false,
      error: { code: 'INVALID_SIMULATION_QUERY', details: [expect.stringContaining('mode must be one of')] },
    });
  });

  it('POST /reset vuelve a normal', async () => {
    await simulate('?mode=error');
    const res = await fetch(`${base}/api/v1/mock/reset`, { method: 'POST' });
    expect((await res.json()).data.activeMode).toBe('normal');
  });
});

describe('APIs externas falsas', () => {
  it('validan los parámetros con 400', async () => {
    const res = await fetch(`${base}/api/v1/mock/external/flights/search?originAirport=BAQ`);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/destinationAirport/);
  });

  it('en modo error responden 503', async () => {
    await simulate('?mode=error&failureReason=Proveedor%20caido');
    const res = await fetch(
      `${base}/api/v1/mock/external/hotels/search?cityCode=Madrid&checkInDate=2026-12-01&checkOutDate=2026-12-03`,
    );
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'Proveedor caido' });
  });
});

describe('Provider Service de punta a punta contra el simulador', () => {
  const route = { originAirport: 'BAQ', destinationAirport: 'CTG', departureDate: '2026-12-01' };

  async function useCase(overrideEnv: Record<string, string | undefined> = {}) {
    const providers = new InMemoryProviderRepository();
    const offers = new InMemoryServiceOfferRepository();
    const provider = makeProvider();
    provider.verify();
    await providers.save(provider);
    await offers.save(makeOffer({
      id: 'flight-offer', availableCapacity: 100,
      metadata: { ...route, flightNumber: flightNumbersFor('BAQ', 'CTG')[0] },
    }));
    await offers.save(makeOffer({
      id: 'hotel-offer', type: ServiceOfferType.ACCOMMODATION, availableCapacity: 100,
      metadata: { cityCode: 'Madrid', hotelCode: hotelCodesFor('Madrid')[0], checkInDate: '2026-12-01', checkOutDate: '2026-12-03' },
    }));
    const registry = createExternalProviderRegistry({ ...env, ...overrideEnv });
    return new CheckAvailabilityUseCase(providers, offers, registry, silentLogger);
  }
  const items = [
    { type: ServiceOfferType.TRANSPORT, providerId: 'prov-1', offerId: 'flight-offer', quantity: 2 },
    { type: ServiceOfferType.ACCOMMODATION, providerId: 'prov-1', offerId: 'hotel-offer', quantity: 1 },
  ];

  it('normal: vuelo y hotel disponibles', async () => {
    const result = await (await useCase()).execute({ items });
    expect(result.available).toBe(true);
  });

  it('unavailable: respuesta de negocio "no disponible" (la Saga compensa), sin excepción', async () => {
    await simulate('?mode=unavailable');
    const result = await (await useCase()).execute({ items });
    expect(result.available).toBe(false);
    expect(result.details.every((d) => !d.available)).toBe(true);
  });

  it('error: falla real del proveedor, ExternalProviderError', async () => {
    await simulate('?mode=error');
    await expect((await useCase()).execute({ items })).rejects.toThrow(ExternalProviderError);
  });

  it('slow: supera el timeout configurado y falla como proveedor caído', async () => {
    await simulate('?mode=slow&delayMs=3000');
    await expect((await useCase({ EXTERNAL_API_TIMEOUT_MS: '300' })).execute({ items })).rejects.toThrow(ExternalProviderError);
  });

  it('volver a normal restablece el servicio', async () => {
    await simulate('?mode=error');
    await simulate('?mode=normal');
    expect((await (await useCase()).execute({ items })).available).toBe(true);
  });

  it('confirmar la reserva consume cupo en el proveedor falso', async () => {
    const registry = createExternalProviderRegistry(env);
    const adapter = registry.resolve(ServiceOfferType.TRANSPORT);
    const [, , scarce] = flightNumbersFor('BAQ', 'CTG'); // 2 asientos
    const meta = { ...route, flightNumber: scarce };
    const first = await adapter.confirmarReserva({ bookingId: 'b1', offerId: 'o', quantity: 2, metadata: meta } as never);
    expect(first.success).toBe(true);
    const check = await adapter.consultarDisponibilidad({ offerId: 'o', quantity: 1, metadata: meta });
    expect(check.available).toBe(false);
  });
});
