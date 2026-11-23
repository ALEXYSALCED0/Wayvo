import 'dotenv/config';

export type PaymentsMode = 'real' | 'mock';

export interface StripeConfig {
  secretKey: string;
  priceId: string;
  webhookSecret?: string;
  timeoutMs: number;
}

export interface PlanInfo {
  code: 'PREMIUM';
  amountCents: number;
  currency: string;
  interval: 'month';
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  mode: PaymentsMode;
  stripe: StripeConfig | null;
  plan: PlanInfo;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const nodeEnv = env.NODE_ENV ?? 'development';
  const rawMode = (env.PAYMENTS_MODE ?? 'mock').toLowerCase();
  if (rawMode !== 'real' && rawMode !== 'mock') {
    throw new Error(`PAYMENTS_MODE must be "real" or "mock" (received "${env.PAYMENTS_MODE}")`);
  }
  const mode: PaymentsMode = rawMode;

  let stripe: StripeConfig | null = null;
  if (mode === 'real') {
    const secretKey = env.STRIPE_SECRET_KEY?.trim();
    const priceId = env.STRIPE_PRICE_ID?.trim();
    if (!secretKey || !priceId) {
      throw new Error(
        'PAYMENTS_MODE=real requires STRIPE_SECRET_KEY and STRIPE_PRICE_ID. Use PAYMENTS_MODE=mock to run without Stripe.',
      );
    }
    // Evita cobrar tarjetas reales por accidente al desarrollar.
    if (secretKey.startsWith('sk_live_') && nodeEnv !== 'production') {
      throw new Error('A live Stripe key (sk_live_) is only allowed with NODE_ENV=production. Use a test key (sk_test_).');
    }
    stripe = {
      secretKey,
      priceId,
      webhookSecret: env.STRIPE_WEBHOOK_SECRET?.trim() || undefined,
      timeoutMs: Number(env.STRIPE_TIMEOUT_MS ?? 10_000),
    };
  }

  return {
    port: Number(env.PORT ?? 3005),
    nodeEnv,
    mode,
    stripe,
    plan: {
      code: 'PREMIUM',
      amountCents: Number(env.PLAN_PRICE_CENTS ?? 495),
      currency: (env.PLAN_CURRENCY ?? 'usd').toLowerCase(),
      interval: 'month',
    },
  };
}
