import { AccountServiceError } from '../../src/adapters/account/errors';
import { HttpAccountPlanGateway, INTERNAL_TOKEN_HEADER } from '../../src/adapters/account/http-account-plan.gateway';

const TOKEN = 'token-interno-secreto';

function fakeFetch(response: { status?: number; body?: unknown } | Error) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const impl = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    if (response instanceof Error) throw response;
    return new Response(JSON.stringify(response.body ?? { success: true }), { status: response.status ?? 200 });
  }) as typeof fetch;
  return { impl, calls };
}

const make = (impl: typeof fetch) =>
  new HttpAccountPlanGateway({ baseUrl: 'http://auth:3004', internalToken: TOKEN, timeoutMs: 500, fetchImpl: impl });

const request = {
  userId: 'user 1',
  plan: 'PREMIUM' as const,
  subscriptionId: 'sub-1',
  currentPeriodEnd: new Date('2026-12-23T00:00:00.000Z'),
};

describe('HttpAccountPlanGateway', () => {
  it('hace PUT a la ruta interna con el token compartido y el correlation id', async () => {
    const { impl, calls } = fakeFetch({});
    await make(impl).setPlan(request, 'corr-1');

    const { url, init } = calls[0];
    const headers = init.headers as Record<string, string>;
    expect(url).toBe('http://auth:3004/api/v1/internal/users/user%201/plan');
    expect(init.method).toBe('PUT');
    expect(headers[INTERNAL_TOKEN_HEADER]).toBe(TOKEN);
    expect(headers['X-Correlation-Id']).toBe('corr-1');
    expect(JSON.parse(String(init.body))).toEqual({
      plan: 'PREMIUM',
      subscriptionId: 'sub-1',
      currentPeriodEnd: '2026-12-23T00:00:00.000Z',
    });
  });

  it('currentPeriodEnd null viaja como null (plan FREE)', async () => {
    const { impl, calls } = fakeFetch({});
    await make(impl).setPlan({ ...request, plan: 'FREE', currentPeriodEnd: null });
    expect(JSON.parse(String(calls[0].init.body)).currentPeriodEnd).toBeNull();
  });

  it('un 5xx de auth-service es AccountServiceError y no filtra el token', async () => {
    const { impl } = fakeFetch({ status: 503, body: { error: { message: 'down' } } });
    const error = await make(impl).setPlan(request).catch((e: Error) => e);
    expect(error).toBeInstanceOf(AccountServiceError);
    expect((error as AccountServiceError).status).toBe(503);
    expect((error as Error).message).not.toContain(TOKEN);
  });

  it('auth-service caído o con timeout es AccountServiceError', async () => {
    const down = await make(fakeFetch(new TypeError('fetch failed')).impl).setPlan(request).catch((e: Error) => e);
    expect(down).toBeInstanceOf(AccountServiceError);
    const timeout = Object.assign(new Error('t'), { name: 'TimeoutError' });
    await expect(make(fakeFetch(timeout).impl).setPlan(request)).rejects.toThrow(/did not respond within 500 ms/);
  });
});
