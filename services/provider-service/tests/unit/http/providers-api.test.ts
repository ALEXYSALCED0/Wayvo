import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ExternalProviderError, AdapterNotRegisteredError } from '../../../src/adapters/external/errors';
import {
  ConfirmacionResultado,
  DisponibilidadResultado,
  IProveedorExterno,
} from '../../../src/application/ports/proveedor-externo.port';
import { ProveedorExternoResolver } from '../../../src/application/ports/proveedor-externo-resolver.port';
import { ServiceOfferType } from '../../../src/domain/value-objects/service-offer-type';
import { buildContainer } from '../../../src/infrastructure/container';
import { InMemoryProviderRepository } from '../../../src/infrastructure/persistence/in-memory-provider.repository';
import { InMemoryServiceOfferRepository } from '../../../src/infrastructure/persistence/in-memory-service-offer.repository';
import { seedCatalog } from '../../../src/infrastructure/persistence/seed/seed-catalog';
import { silentLogger } from '../application/helpers';
import { postJson, startApp, TestServer } from './test-server';

// Proveedor externo controlable: cada test decide qué responde
class ScriptedExternal implements IProveedorExterno {
  availability: DisponibilidadResultado | Error = { available: true, remainingUnits: 50 };
  confirmation: ConfirmacionResultado | Error = { success: true, reservationCode: 'PNR-1', confirmationCode: 'TK-1' };
  confirmations = 0;

  async consultarDisponibilidad(): Promise<DisponibilidadResultado> {
    if (this.availability instanceof Error) throw this.availability;
    return this.availability;
  }

  async confirmarReserva(): Promise<ConfirmacionResultado> {
    this.confirmations++;
    if (this.confirmation instanceof Error) throw this.confirmation;
    return this.confirmation;
  }
}

const external = new ScriptedExternal();
const resolver: ProveedorExternoResolver = {
  resolve(type) {
    if (type === ServiceOfferType.ACTIVITY) throw new AdapterNotRegisteredError(type);
    return external;
  },
};

let ctx: TestServer;
let offers: InMemoryServiceOfferRepository;

beforeAll(async () => {
  const providers = new InMemoryProviderRepository();
  offers = new InMemoryServiceOfferRepository();
  await seedCatalog(providers, offers);
  const container = await buildContainer({ NODE_ENV: 'test' }, {
    logger: silentLogger,
    externals: resolver,
    persistence: { providers, offers, kind: 'in-memory', shutdown: async () => {} },
  });
  ctx = await startApp(container);
});
afterAll(() => ctx.close());
beforeEach(() => {
  external.availability = { available: true, remainingUnits: 50 };
  external.confirmation = { success: true, reservationCode: 'PNR-1', confirmationCode: 'TK-1' };
  external.confirmations = 0;
});

const url = (path: string) => `${ctx.base}/api/v1/providers${path}`;
const flight = (quantity = 1, offerId = 'offer-aerocaribe-bog-ctg-am') => ({
  type: 'TRANSPORT', providerId: 'prov-aerocaribe', offerId, quantity,
});

describe('GET /api/v1/providers', () => {
  it('lista el catálogo con el sobre ApiResponse y sin nulos', async () => {
    const res = await fetch(url(''));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(8);
    const aero = body.data.find((p: { id: string }) => p.id === 'prov-aerocaribe');
    expect(aero).toMatchObject({ type: 'TRANSPORT', verificationStatus: 'VERIFIED', rating: 4.5 });
    expect(aero.offers).toBeUndefined();
    const brisas = body.data.find((p: { id: string }) => p.id === 'prov-brisas-hostal');
    expect(brisas).not.toHaveProperty('contactPhone');
    expect(JSON.stringify(body)).not.toContain('null');
  });

  it('filtra por tipo y estado, y puede incluir las ofertas', async () => {
    const res = await fetch(url('?type=ACCOMMODATION&verificationStatus=VERIFIED&includeOffers=true'));
    const body = await res.json();

    expect(body.data.map((p: { id: string }) => p.id).sort()).toEqual(['prov-casas-del-mar', 'prov-hotel-colonial']);
    expect(body.data[0].offers.length).toBeGreaterThan(0);
    expect(body.data[0].offers[0]).toMatchObject({ currency: 'COP', active: true });
  });

  it('filtro inválido: 400 con detalle', async () => {
    const res = await fetch(url('?type=SPACESHIP'));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body).toMatchObject({ success: false, error: { code: 'VALIDATION_ERROR' } });
    expect(body.error.details[0].path).toBe('type');
  });
});

describe('POST /api/v1/providers/check-availability', () => {
  it('disponible: 200 con available=true y detalle', async () => {
    const res = await postJson(url('/check-availability'), { items: [flight(2)] });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toMatchObject({
      success: true,
      data: { available: true, details: [{ offerId: 'offer-aerocaribe-bog-ctg-am', available: true }] },
    });
  });

  it('sin disponibilidad es una respuesta de negocio: 200 con available=false y motivo', async () => {
    external.availability = { available: false, remainingUnits: 0, reason: 'Sold out' };
    const res = await postJson(url('/check-availability'), { items: [flight()] });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.available).toBe(false);
    expect(body.data.reason).toContain('Sold out');
  });

  it('proveedor sin verificar o cupo local insuficiente: available=false', async () => {
    const pending = await postJson(url('/check-availability'), {
      items: [{ type: 'ACCOMMODATION', providerId: 'prov-brisas-hostal', offerId: 'x', quantity: 1 }],
    });
    expect((await pending.json()).data.available).toBe(false);

    const tooMany = await postJson(url('/check-availability'), { items: [flight(999)] });
    expect((await tooMany.json()).data.reason).toContain('Not enough capacity');
  });

  it('falla del proveedor externo: 502 EXTERNAL_PROVIDER_ERROR', async () => {
    external.availability = new ExternalProviderError('transporte', 'transporte.buscarVuelos failed: HTTP 503');
    const res = await postJson(url('/check-availability'), { items: [flight()] });
    const body = await res.json();
    expect(res.status).toBe(502);
    expect(body.error).toMatchObject({ code: 'EXTERNAL_PROVIDER_ERROR', details: { provider: 'transporte' } });
  });

  it('tipo de oferta sin adapter (ACTIVITY): 501', async () => {
    const res = await postJson(url('/check-availability'), {
      items: [{ type: 'ACTIVITY', providerId: 'prov-ruta-cafetera', offerId: 'offer-cafetera-finca', quantity: 1 }],
    });
    expect(res.status).toBe(501);
    expect((await res.json()).error.code).toBe('ADAPTER_NOT_REGISTERED');
  });

  it.each([
    ['sin items', {}],
    ['items vacío', { items: [] }],
    ['cantidad cero', { items: [flight(0)] }],
    ['cantidad decimal', { items: [flight(1.5)] }],
    ['tipo desconocido', { items: [{ ...flight(), type: 'BOAT' }] }],
    ['falta offerId', { items: [{ type: 'TRANSPORT', providerId: 'p', quantity: 1 }] }],
  ])('cuerpo inválido (%s): 400', async (_name, body) => {
    const res = await postJson(url('/check-availability'), body);
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/v1/providers/confirm', () => {
  it('confirma: 200 con el código de reserva que lee booking-service y descuenta el cupo', async () => {
    const before = (await offers.findById('offer-aerocaribe-bog-ctg-am'))!.availableCapacity;
    const res = await postJson(url('/confirm'), { bookingId: 'bk-1', items: [flight(2)] });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({
      bookingId: 'bk-1',
      reservationCode: 'RES-bk-1',
      confirmationCode: 'PNR-1,TK-1',
      items: [{ offerId: 'offer-aerocaribe-bog-ctg-am', quantity: 2, reservationCode: 'PNR-1', confirmationCode: 'TK-1' }],
    });
    expect((await offers.findById('offer-aerocaribe-bog-ctg-am'))!.availableCapacity).toBe(before - 2);
  });

  it('el proveedor rechaza: 409 RESERVATION_REJECTED y el cupo queda igual', async () => {
    external.confirmation = { success: false, reason: 'Sold out' };
    const before = (await offers.findById('offer-aerocaribe-bog-ctg-am'))!.availableCapacity;

    const res = await postJson(url('/confirm'), { bookingId: 'bk-2', items: [flight(1)] });
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toMatchObject({ code: 'RESERVATION_REJECTED' });
    expect(body.error.message).toContain('Sold out');
    expect((await offers.findById('offer-aerocaribe-bog-ctg-am'))!.availableCapacity).toBe(before);
  });

  it('falla del proveedor externo: 502', async () => {
    external.confirmation = new ExternalProviderError('transporte', 'transporte.reservarVuelo failed: timeout');
    const res = await postJson(url('/confirm'), { bookingId: 'bk-3', items: [flight()] });
    expect(res.status).toBe(502);
  });

  it('proveedor rechazado en el catálogo: 409', async () => {
    const res = await postJson(url('/confirm'), {
      bookingId: 'bk-4',
      items: [{ type: 'TRANSPORT', providerId: 'prov-transportes-express', offerId: 'nope', quantity: 1 }],
    });
    expect(res.status).toBe(409);
    expect(external.confirmations).toBe(0);
  });

  it('sin bookingId: 400', async () => {
    const res = await postJson(url('/confirm'), { items: [flight()] });
    expect(res.status).toBe(400);
  });
});

describe('transversales', () => {
  it('devuelve el correlation id recibido o genera uno', async () => {
    const given = await fetch(url(''), { headers: { 'x-correlation-id': 'saga-123' } });
    expect(given.headers.get('x-correlation-id')).toBe('saga-123');
    const generated = await fetch(url(''));
    expect(generated.headers.get('x-correlation-id')).toMatch(/^prov-/);
  });

  it('JSON mal formado: 400 INVALID_JSON', async () => {
    const res = await fetch(url('/check-availability'), {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{oops',
    });
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe('INVALID_JSON');
  });

  it('ruta desconocida: 404 con ApiResponse', async () => {
    const res = await fetch(`${ctx.base}/api/v1/nope`);
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe('NOT_FOUND');
  });

  it('/health indica el tipo de persistencia', async () => {
    const body = await (await fetch(`${ctx.base}/health`)).json();
    expect(body.data).toMatchObject({ status: 'healthy', service: 'provider-service', persistence: 'in-memory' });
  });

  it('un error inesperado devuelve 500 genérico sin filtrar detalles', async () => {
    const boom: ProveedorExternoResolver = { resolve: () => { throw new Error('secret internals'); } };
    const providers = new InMemoryProviderRepository();
    await seedCatalog(providers, offers);
    const server = await startApp(await buildContainer({ NODE_ENV: 'test' }, {
      logger: silentLogger, externals: boom,
      persistence: { providers, offers, kind: 'in-memory', shutdown: async () => {} },
    }));
    const res = await postJson(`${server.base}/api/v1/providers/check-availability`, { items: [flight()] });
    const body = await res.json();
    await server.close();

    expect(res.status).toBe(500);
    expect(body.error).toEqual({ code: 'INTERNAL_ERROR', message: 'Internal server error' });
  });
});
