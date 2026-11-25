import { CORRELATION_ID_HEADER } from '@wayvo/contracts';
import { AiPlanQuotaDecision, AiPlanQuotaPort } from '../../application/ports/ai-plan-quota.port';
import { ServiceUnavailableError, UnauthorizedError } from '../../domain/errors/gateway.error';

const INTERNAL_TOKEN_HEADER = 'x-internal-token';

// Habla con las rutas internas de auth-service (protegidas con el token compartido).
export class HttpAiPlanQuotaGateway implements AiPlanQuotaPort {
  constructor(
    private readonly baseUrl: string,
    private readonly internalToken: string,
    private readonly timeoutMs: number = 5000,
  ) {}

  async consume(userId: string, budgetCategory: string | undefined, correlationId: string): Promise<AiPlanQuotaDecision> {
    const response = await this.post(`/api/v1/internal/users/${encodeURIComponent(userId)}/ai-plans/consume`, correlationId, {
      budgetCategory,
    });
    // La cuenta del token ya no existe: la sesión no sirve.
    if (response.status === 404) throw new UnauthorizedError('La cuenta ya no existe. Inicia sesión de nuevo');
    const body = (await response.json().catch(() => null)) as { data?: AiPlanQuotaDecision } | null;
    if (!response.ok || !body?.data) {
      // Fallar CERRADO: si no se puede comprobar el plan, no se genera (no se regalan planes ilimitados).
      throw new ServiceUnavailableError('auth-service', this.baseUrl, `Respuesta ${response.status} al consultar el plan de la cuenta`);
    }
    return body.data;
  }

  async release(userId: string, period: string, correlationId: string): Promise<void> {
    const response = await this.post(`/api/v1/internal/users/${encodeURIComponent(userId)}/ai-plans/release`, correlationId, {
      period,
    });
    if (!response.ok) throw new Error(`auth-service respondió ${response.status} al devolver el plan`);
  }

  private async post(path: string, correlationId: string, body: object): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          [INTERNAL_TOKEN_HEADER]: this.internalToken,
          [CORRELATION_ID_HEADER]: correlationId,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      throw new ServiceUnavailableError('auth-service', this.baseUrl, err instanceof Error ? err.message : String(err));
    } finally {
      clearTimeout(timer);
    }
  }
}
