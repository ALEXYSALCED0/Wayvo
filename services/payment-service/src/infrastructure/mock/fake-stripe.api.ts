import { InvalidWebhookSignatureError, PaymentProviderError } from '../../adapters/payment/errors';
import {
  StripeApi,
  StripeSubscription,
  StripeWebhookEvent,
} from '../../adapters/payment/stripe-api';
import { PaymentSimulationState } from './simulation-state';

export const MOCK_WEBHOOK_SIGNATURE = 'mock-signature';
const PERIOD_SECONDS = 30 * 24 * 60 * 60;

// ADAPTEE simulado: responde con la MISMA forma que la API de Stripe, pero sin red ni claves.
// Sirve para pruebas y demos. El modo (normal, declined, error, slow) se cambia en caliente.
export class FakeStripeApi implements StripeApi {
  private readonly subscriptions = new Map<string, StripeSubscription & { paid: boolean }>();
  private counter = 0;

  constructor(
    private readonly state: PaymentSimulationState = new PaymentSimulationState(),
    private readonly now: () => number = () => Date.now(),
  ) {}

  async createCustomer(): Promise<{ id: string }> {
    await this.gate();
    this.counter += 1;
    return { id: `cus_mock_${this.counter}` };
  }

  async createSubscription(input: { customerId: string }): Promise<StripeSubscription> {
    await this.gate();
    this.counter += 1;
    const id = `sub_mock_${this.counter}`;
    const sub: StripeSubscription & { paid: boolean } = {
      id,
      customer: input.customerId,
      status: 'incomplete',
      cancel_at_period_end: false,
      latest_invoice: { confirmation_secret: { client_secret: `${id}_secret_mock` } },
      paid: false,
    };
    this.subscriptions.set(id, sub);
    return this.view(sub);
  }

  // Simula que el navegador ya cobró: con el modo "normal", la primera consulta la deja ACTIVE.
  async retrieveSubscription(subscriptionId: string): Promise<StripeSubscription> {
    await this.gate();
    const sub = this.find(subscriptionId);
    if (sub.status === 'incomplete' && this.state.mode === 'normal') {
      sub.status = 'active';
      sub.paid = true;
      sub.items = { data: [{ current_period_end: Math.floor(this.now() / 1000) + PERIOD_SECONDS }] };
    }
    return this.view(sub);
  }

  async cancelSubscription(subscriptionId: string): Promise<StripeSubscription> {
    await this.gate();
    const sub = this.find(subscriptionId);
    sub.status = 'canceled';
    return this.view(sub);
  }

  async refundLatestPayment(subscriptionId: string): Promise<boolean> {
    await this.gate();
    return this.find(subscriptionId).paid;
  }

  // En el simulador la "firma" es una constante y el cuerpo es el evento en JSON.
  constructWebhookEvent(rawBody: string, signature: string | undefined): StripeWebhookEvent {
    if (signature !== MOCK_WEBHOOK_SIGNATURE) throw new InvalidWebhookSignatureError();
    try {
      return JSON.parse(rawBody) as StripeWebhookEvent;
    } catch {
      throw new PaymentProviderError('Webhook body is not valid JSON');
    }
  }

  private async gate(): Promise<void> {
    if (this.state.mode === 'error') throw new PaymentProviderError('Payment provider unavailable (simulated)', 503);
    if (this.state.mode === 'slow') await new Promise((resolve) => setTimeout(resolve, this.state.delayMs));
  }

  private find(id: string): StripeSubscription & { paid: boolean } {
    const sub = this.subscriptions.get(id);
    if (!sub) throw new PaymentProviderError(`No such subscription: ${id}`, 404);
    return sub;
  }

  private view(sub: StripeSubscription & { paid: boolean }): StripeSubscription {
    const { paid: _paid, ...rest } = sub;
    return structuredClone(rest);
  }
}
