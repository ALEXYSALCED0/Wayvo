// Errores propios de la capa de pasarela. Nunca incluyen claves ni cuerpos de petición.

// La pasarela falló (caída, timeout, respuesta rara, rechazo de la API). HTTP 502.
export class PaymentProviderError extends Error {
  readonly code = 'PAYMENT_PROVIDER_ERROR';

  constructor(
    message: string,
    readonly status: number | null = null,
  ) {
    super(message);
    this.name = 'PaymentProviderError';
  }
}

// El webhook no trae una firma válida: no se procesa. HTTP 400.
export class InvalidWebhookSignatureError extends Error {
  readonly code = 'INVALID_WEBHOOK_SIGNATURE';

  constructor(message = 'Invalid webhook signature') {
    super(message);
    this.name = 'InvalidWebhookSignatureError';
  }
}
