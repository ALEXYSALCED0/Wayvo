import { AIPlanRecommendationInput, AIPlanRecommendationResult, CORRELATION_ID_HEADER } from '@wayvo/contracts';
import { generateFallbackPlan } from '../../application/facades/fallback-plan.generator';
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

      console.warn(
        `[HttpAiServiceGateway] ai-recommendation returned status ${response.status}. Using contract-compliant fallback plan.`,
      );
      return generateFallbackPlan(input);
    } catch (err: any) {
      console.warn(
        `[HttpAiServiceGateway] ai-recommendation is unreachable or in development (${err.message}). Using contract-compliant fallback plan.`,
      );
      return generateFallbackPlan(input);
    }
  }
}
