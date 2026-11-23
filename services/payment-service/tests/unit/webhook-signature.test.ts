import { InvalidWebhookSignatureError } from '../../src/adapters/payment/errors';
import { signStripePayload, verifyStripeSignature } from '../../src/infrastructure/stripe/webhook-signature';

const SECRET = 'whsec_test_secret';
const BODY = '{"id":"evt_1","type":"customer.subscription.updated"}';
const NOW = 1_800_000_000;

describe('verifyStripeSignature', () => {
  it('acepta una firma válida', () => {
    const header = signStripePayload(BODY, SECRET, NOW);
    expect(() => verifyStripeSignature(BODY, header, SECRET, NOW)).not.toThrow();
  });

  it('rechaza si el cuerpo cambió', () => {
    const header = signStripePayload(BODY, SECRET, NOW);
    expect(() => verifyStripeSignature(`${BODY} `, header, SECRET, NOW)).toThrow(InvalidWebhookSignatureError);
  });

  it('rechaza si el secreto es otro', () => {
    const header = signStripePayload(BODY, 'whsec_otro', NOW);
    expect(() => verifyStripeSignature(BODY, header, SECRET, NOW)).toThrow(InvalidWebhookSignatureError);
  });

  it('rechaza una petición vieja (fuera de la tolerancia de tiempo)', () => {
    const header = signStripePayload(BODY, SECRET, NOW - 600);
    expect(() => verifyStripeSignature(BODY, header, SECRET, NOW)).toThrow(/tolerance/);
  });

  it('rechaza cabecera ausente o mal formada', () => {
    expect(() => verifyStripeSignature(BODY, undefined, SECRET, NOW)).toThrow(/Missing/);
    expect(() => verifyStripeSignature(BODY, 'basura', SECRET, NOW)).toThrow(/Malformed/);
    expect(() => verifyStripeSignature(BODY, `t=${NOW},v1=zz`, SECRET, NOW)).toThrow(InvalidWebhookSignatureError);
  });

  it('acepta si alguna de varias firmas v1 es válida', () => {
    const good = signStripePayload(BODY, SECRET, NOW);
    const header = `${good},v1=${'0'.repeat(64)}`;
    expect(() => verifyStripeSignature(BODY, header, SECRET, NOW)).not.toThrow();
  });
});
