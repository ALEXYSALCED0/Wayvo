import { createHmac, timingSafeEqual } from 'node:crypto';
import { InvalidWebhookSignatureError } from '../../adapters/payment/errors';

const DEFAULT_TOLERANCE_SECONDS = 300;

// Verifica la cabecera Stripe-Signature: "t=<segundos>,v1=<hmac>[,v1=...]".
// El HMAC-SHA256 se calcula sobre "<t>.<cuerpo crudo>" con el secreto del webhook (whsec_...).
// La tolerancia de tiempo evita que alguien reenvíe una petición vieja interceptada.
export function verifyStripeSignature(
  rawBody: string,
  header: string | undefined,
  secret: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
  toleranceSeconds: number = DEFAULT_TOLERANCE_SECONDS,
): void {
  if (!header) throw new InvalidWebhookSignatureError('Missing Stripe-Signature header');

  let timestamp: string | null = null;
  const signatures: string[] = [];
  for (const part of header.split(',')) {
    const [key, value] = part.split('=');
    if (key === 't') timestamp = value ?? null;
    else if (key === 'v1' && value) signatures.push(value);
  }
  if (!timestamp || signatures.length === 0 || !/^\d+$/.test(timestamp)) {
    throw new InvalidWebhookSignatureError('Malformed Stripe-Signature header');
  }
  if (Math.abs(nowSeconds - Number(timestamp)) > toleranceSeconds) {
    throw new InvalidWebhookSignatureError('Webhook timestamp outside the tolerance window');
  }

  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest();
  const valid = signatures.some((candidate) => {
    const given = Buffer.from(candidate, 'hex');
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
  if (!valid) throw new InvalidWebhookSignatureError();
}

// Para pruebas y para simular webhooks con `curl`.
export function signStripePayload(rawBody: string, secret: string, timestampSeconds: number): string {
  const hmac = createHmac('sha256', secret).update(`${timestampSeconds}.${rawBody}`).digest('hex');
  return `t=${timestampSeconds},v1=${hmac}`;
}
