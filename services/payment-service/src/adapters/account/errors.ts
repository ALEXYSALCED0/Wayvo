// auth-service no pudo actualizar el plan de la cuenta (caída, timeout, rechazo). HTTP 502.
export class AccountServiceError extends Error {
  readonly code = 'ACCOUNT_SERVICE_ERROR';

  constructor(
    message: string,
    readonly status: number | null = null,
  ) {
    super(message);
    this.name = 'AccountServiceError';
  }
}
