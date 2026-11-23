import { loadConfig } from '../../src/infrastructure/config/env';

describe('loadConfig', () => {
  it('por defecto usa el simulador, puerto 3005 y plan de USD 4.95', () => {
    const config = loadConfig({});
    expect(config.mode).toBe('mock');
    expect(config.port).toBe(3005);
    expect(config.stripe).toBeNull();
    expect(config.plan).toEqual({ code: 'PREMIUM', amountCents: 495, currency: 'usd', interval: 'month' });
  });

  it('modo real exige clave y precio', () => {
    expect(() => loadConfig({ PAYMENTS_MODE: 'real' })).toThrow(/STRIPE_SECRET_KEY/);
    const config = loadConfig({ PAYMENTS_MODE: 'real', STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_PRICE_ID: 'price_1' });
    expect(config.stripe).toMatchObject({ secretKey: 'sk_test_x', priceId: 'price_1', timeoutMs: 10_000 });
  });

  it('una clave live fuera de producción se rechaza', () => {
    expect(() => loadConfig({ PAYMENTS_MODE: 'real', STRIPE_SECRET_KEY: 'sk_live_x', STRIPE_PRICE_ID: 'price_1' })).toThrow(/sk_live_/);
    expect(() =>
      loadConfig({
        PAYMENTS_MODE: 'real',
        NODE_ENV: 'production',
        STRIPE_SECRET_KEY: 'sk_live_x',
        STRIPE_PRICE_ID: 'price_1',
        AUTH_SERVICE_URL: 'http://auth:3004',
        INTERNAL_SERVICE_TOKEN: 't',
      }),
    ).not.toThrow();
  });

  it('un modo desconocido es un error', () => {
    expect(() => loadConfig({ PAYMENTS_MODE: 'otro' })).toThrow(/PAYMENTS_MODE/);
  });

  describe('cuenta (auth-service)', () => {
    it('sin AUTH_SERVICE_URL usa la cuenta simulada', () => {
      expect(loadConfig({}).account).toBeNull();
    });

    it('con AUTH_SERVICE_URL exige el token interno', () => {
      expect(() => loadConfig({ AUTH_SERVICE_URL: 'http://auth:3004' })).toThrow(/INTERNAL_SERVICE_TOKEN/);
      const config = loadConfig({ AUTH_SERVICE_URL: 'http://auth:3004/', INTERNAL_SERVICE_TOKEN: 't' });
      expect(config.account).toEqual({ authServiceUrl: 'http://auth:3004', internalToken: 't', timeoutMs: 5000 });
    });

    it('en producción la cuenta real es obligatoria', () => {
      expect(() => loadConfig({ NODE_ENV: 'production' })).toThrow(/AUTH_SERVICE_URL/);
    });
  });
});
