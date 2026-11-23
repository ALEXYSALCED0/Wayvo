import { PaymentProviderError } from '../../adapters/payment/errors';
import {
  StripeApi,
  StripeSubscription,
  StripeWebhookEvent,
} from '../../adapters/payment/stripe-api';
import { encodeForm } from './form-encode';
import { verifyStripeSignature } from './webhook-signature';

// Versión de la API fijada a propósito: así Stripe no cambia la forma de las respuestas
// por su cuenta. En esta versión el client_secret del primer pago está en
// latest_invoice.confirmation_secret y el periodo vive en cada item de la suscripción.
export const STRIPE_API_VERSION = '2025-03-31.basil';
const STRIPE_BASE_URL = 'https://api.stripe.com/v1';

export interface StripeHttpApiOptions {
  secretKey: string;
  priceId: string;
  webhookSecret?: string;
  timeoutMs: number;
  // Inyectable para pruebas.
  fetchImpl?: typeof fetch;
  baseUrl?: string;
}

// ADAPTEE real: habla con la API de Stripe por HTTP. La clave secreta solo viaja en la
// cabecera Authorization y NUNCA aparece en un mensaje de error ni en un log.
export class StripeHttpApi implements StripeApi {
  private readonly fetchImpl: typeof fetch;
  private readonly baseUrl: string;

  constructor(private readonly options: StripeHttpApiOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.baseUrl = options.baseUrl ?? STRIPE_BASE_URL;
  }

  async createCustomer(input: { email: string; name?: string; userId: string; idempotencyKey: string }) {
    return this.request<{ id: string }>('POST', '/customers', {
      body: { email: input.email, name: input.name, metadata: { userId: input.userId } },
      idempotencyKey: input.idempotencyKey,
    });
  }

  async createSubscription(input: { customerId: string; userId: string; idempotencyKey: string }) {
    return this.request<StripeSubscription>('POST', '/subscriptions', {
      body: {
        customer: input.customerId,
        items: [{ price: this.options.priceId }],
        // La suscripción queda "incomplete" hasta que el navegador confirme el primer pago.
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.confirmation_secret'],
        metadata: { userId: input.userId },
      },
      idempotencyKey: input.idempotencyKey,
    });
  }

  async retrieveSubscription(subscriptionId: string) {
    return this.request<StripeSubscription>('GET', `/subscriptions/${encodeURIComponent(subscriptionId)}`);
  }

  async cancelSubscription(subscriptionId: string) {
    return this.request<StripeSubscription>('DELETE', `/subscriptions/${encodeURIComponent(subscriptionId)}`);
  }

  async refundLatestPayment(subscriptionId: string): Promise<boolean> {
    const sub = await this.request<{
      latest_invoice?: { payments?: { data: Array<{ status?: string; payment?: { type?: string; payment_intent?: string } }> } } | string | null;
    }>('GET', `/subscriptions/${encodeURIComponent(subscriptionId)}`, {
      query: { 'expand[0]': 'latest_invoice.payments' },
    });
    const invoice = sub.latest_invoice;
    if (!invoice || typeof invoice === 'string') return false;
    const paid = invoice.payments?.data.find((p) => p.status === 'paid' && p.payment?.payment_intent);
    const paymentIntent = paid?.payment?.payment_intent;
    if (!paymentIntent) return false;

    await this.request('POST', '/refunds', {
      body: { payment_intent: paymentIntent, reason: 'requested_by_customer' },
      idempotencyKey: `refund:${paymentIntent}`,
    });
    return true;
  }

  constructWebhookEvent(rawBody: string, signature: string | undefined): StripeWebhookEvent {
    if (!this.options.webhookSecret) {
      throw new PaymentProviderError('STRIPE_WEBHOOK_SECRET is not configured');
    }
    verifyStripeSignature(rawBody, signature, this.options.webhookSecret);
    try {
      return JSON.parse(rawBody) as StripeWebhookEvent;
    } catch {
      throw new PaymentProviderError('Webhook body is not valid JSON');
    }
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    options: { body?: Record<string, unknown>; query?: Record<string, string>; idempotencyKey?: string } = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.options.secretKey}`,
      'Stripe-Version': STRIPE_API_VERSION,
    };
    let url = `${this.baseUrl}${path}`;
    let body: string | undefined;
    if (method === 'POST') {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      body = encodeForm(options.body ?? {});
      if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;
    }
    if (options.query) {
      url += `?${new URLSearchParams(options.query).toString()}`;
    }

    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        method,
        headers,
        body,
        signal: AbortSignal.timeout(this.options.timeoutMs),
      });
    } catch (error) {
      const timeout = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
      throw new PaymentProviderError(
        timeout ? `Stripe did not respond within ${this.options.timeoutMs} ms` : 'Could not reach Stripe',
      );
    }

    const payload = (await response.json().catch(() => null)) as
      | { error?: { message?: string; code?: string; type?: string } }
      | null;
    if (!response.ok) {
      const detail = payload?.error?.message ?? response.statusText;
      throw new PaymentProviderError(`Stripe responded ${response.status}: ${detail}`, response.status);
    }
    return payload as T;
  }
}
