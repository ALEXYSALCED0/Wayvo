import {
  AccountPlanGateway,
  SetAccountPlanRequest,
} from '../../application/ports/account-plan.gateway';
import { AccountServiceError } from './errors';

export const INTERNAL_TOKEN_HEADER = 'x-internal-token';

export interface HttpAccountPlanGatewayOptions {
  baseUrl: string;
  internalToken: string;
  timeoutMs: number;
  fetchImpl?: typeof fetch;
}

// Adaptador de salida hacia auth-service:
//   PUT {AUTH_SERVICE_URL}/api/v1/internal/users/:userId/plan
//   body: { plan, subscriptionId, currentPeriodEnd }
// Es una ruta INTERNA: no pasa por el api-gateway y exige el token compartido entre servicios.
export class HttpAccountPlanGateway implements AccountPlanGateway {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: HttpAccountPlanGatewayOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async setPlan(request: SetAccountPlanRequest, correlationId?: string): Promise<void> {
    const url = `${this.options.baseUrl}/api/v1/internal/users/${encodeURIComponent(request.userId)}/plan`;
    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          [INTERNAL_TOKEN_HEADER]: this.options.internalToken,
          ...(correlationId && { 'X-Correlation-Id': correlationId }),
        },
        body: JSON.stringify({
          plan: request.plan,
          subscriptionId: request.subscriptionId,
          currentPeriodEnd: request.currentPeriodEnd ? request.currentPeriodEnd.toISOString() : null,
        }),
        signal: AbortSignal.timeout(this.options.timeoutMs),
      });
    } catch (error) {
      const timeout = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
      throw new AccountServiceError(
        timeout ? `auth-service did not respond within ${this.options.timeoutMs} ms` : 'Could not reach auth-service',
      );
    }

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
      const detail = payload?.error?.message ?? response.statusText;
      throw new AccountServiceError(`auth-service responded ${response.status}: ${detail}`, response.status);
    }
  }
}
