import { AIPlanRecommendationInput, AIPlanRecommendationResult, CORRELATION_ID_HEADER } from '@wayvo/contracts';
import { AiServicePort } from '../../application/ports/ai-service.port';

export class HttpAiServiceGateway implements AiServicePort {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs: number = 5000,
  ) {}

  async generatePlan(input: AIPlanRecommendationInput, correlationId: string): Promise<AIPlanRecommendationResult> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(`${this.baseUrl}/api/v1/ai/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [CORRELATION_ID_HEADER]: correlationId,
        },
        body: JSON.stringify(input),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const body = (await response.json()) as any;
        return body.data || body;
      }

      const errBody = (await response.json().catch(() => ({}))) as any;
      const errMsg = errBody.error?.message || errBody.detail?.message || `Error ${response.status} en el servicio de IA`;
      throw new Error(`[AI Service] ${errMsg}`);
    } catch (err: any) {
      console.error(`[HttpAiServiceGateway] ai-recommendation error: ${err.message}`);
      throw new Error(`Error con el servidor: no se pudo completar la consulta de IA (${err.message})`);
    }
  }
}
