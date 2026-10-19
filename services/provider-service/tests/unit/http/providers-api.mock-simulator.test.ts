import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildContainer } from '../../../src/infrastructure/container';
import { silentLogger } from '../application/helpers';
import { freePort, postJson, startApp, TestServer } from './test-server';

// Servicio completo (casos de uso + adapters reales + simulador) hablando por HTTP consigo mismo
let ctx: TestServer;

async function boot(extraEnv: Record<string, string> = {}) {
  const port = await freePort();
  const env = {
    NODE_ENV: 'test', PORT: String(port), EXTERNAL_PROVIDERS_MODE: 'mock', EXTERNAL_API_TIMEOUT_MS: '1500', ...extraEnv,
  };
  const container = await buildContainer(env, { logger: silentLogger });
  return startApp(container, env, port);
}

// catálogo e inventario del simulador en su estado inicial
beforeEach(async () => {
  ctx = await boot();
});
afterEach(() => ctx.close());

const providers = (path: string) => `${ctx.base}/api/v1/providers${path}`;
const simulate = (query: string) => fetch(`${ctx.base}/api/v1/mock/simulate-failure${query}`);
const flight = (offerId: string, quantity: number) => ({
  type: 'TRANSPORT', providerId: 'prov-aerocaribe', offerId, quantity,
});
const stay = (offerId: string, providerId: string, quantity: number) => ({
  type: 'ACCOMMODATION', providerId, offerId, quantity,
});

describe('flujo de la Saga contra el simulador', () => {
  it('check-availability + confirm de vuelo y hotel', async () => {
    const items = [flight('offer-aerocaribe-bog-ctg-am', 2), stay('offer-colonial-standard', 'prov-hotel-colonial', 1)];

    const check = await (await postJson(providers('/check-availability'), { items })).json();
    expect(check.data.available).toBe(true);

    const res = await postJson(providers('/confirm'), { bookingId: 'bk-e2e', items });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.reservationCode).toBe('RES-bk-e2e');
    expect(body.data.items[0].reservationCode).toMatch(/^MOCK-FL-/);
    expect(body.data.items[1].reservationCode).toMatch(/^MOCK-HT-/);

    const catalog = await (await fetch(providers('?type=TRANSPORT&includeOffers=true'))).json();
    const offer = catalog.data.find((p: { id: string }) => p.id === 'prov-aerocaribe').offers
      .find((o: { id: string }) => o.id === 'offer-aerocaribe-bog-ctg-am');
    expect(offer.availableCapacity).toBe(28);
  });

  it('últimos cupos: la segunda reserva del mismo vuelo se rechaza y el catálogo no se toca', async () => {
    const lastSeats = flight('offer-aerocaribe-bog-ctg-pm', 2); // 2 asientos
    expect((await postJson(providers('/confirm'), { bookingId: 'a', items: [lastSeats] })).status).toBe(200);

    const check = await (await postJson(providers('/check-availability'), { items: [flight('offer-aerocaribe-bog-ctg-pm', 1)] })).json();
    expect(check.data.available).toBe(false);

    const second = await postJson(providers('/confirm'), { bookingId: 'b', items: [flight('offer-aerocaribe-bog-ctg-pm', 1)] });
    expect(second.status).toBe(409);
  });

  it('simulador en "unavailable": check responde available=false y confirm responde 409', async () => {
    await simulate('?mode=unavailable&failureReason=Overbooked');
    const items = [flight('offer-aerocaribe-bog-ctg-am', 1)];

    const check = await (await postJson(providers('/check-availability'), { items })).json();
    expect(check.data.available).toBe(false);

    const confirm = await postJson(providers('/confirm'), { bookingId: 'bk-u', items });
    expect(confirm.status).toBe(409);
    expect((await confirm.json()).error.message).toContain('Overbooked');
  });

  it('simulador en "error": 502 en check y en confirm; al volver a normal se recupera', async () => {
    await simulate('?mode=error');
    const items = [flight('offer-aerocaribe-bog-ctg-am', 1)];
    expect((await postJson(providers('/check-availability'), { items })).status).toBe(502);
    expect((await postJson(providers('/confirm'), { bookingId: 'bk-e', items })).status).toBe(502);

    await simulate('?mode=normal');
    expect((await postJson(providers('/check-availability'), { items })).status).toBe(200);
  });

  it('simulador en "slow": supera el timeout externo y responde 502', async () => {
    const slow = await boot({ EXTERNAL_API_TIMEOUT_MS: '300' });
    try {
      await fetch(`${slow.base}/api/v1/mock/simulate-failure?mode=slow&delayMs=4000`);
      const res = await postJson(`${slow.base}/api/v1/providers/check-availability`, {
        items: [flight('offer-aerocaribe-bog-ctg-am', 1)],
      });
      expect(res.status).toBe(502);
    } finally {
      await slow.close();
    }
  });

  it('una confirmación que falla a medias deja el catálogo intacto', async () => {
    // el vuelo se confirma, pero al segundo item no le alcanza el cupo local: se debe devolver el del vuelo
    const items = [flight('offer-aerocaribe-bog-ctg-am', 3), stay('offer-colonial-standard', 'prov-hotel-colonial', 99)];
    const res = await postJson(providers('/confirm'), { bookingId: 'bk-rb', items });
    expect(res.status).toBe(409);

    const catalog = await (await fetch(providers('?type=TRANSPORT&includeOffers=true'))).json();
    const offer = catalog.data.find((p: { id: string }) => p.id === 'prov-aerocaribe').offers
      .find((o: { id: string }) => o.id === 'offer-aerocaribe-bog-ctg-am');
    expect(offer.availableCapacity).toBe(30);
  });
});
