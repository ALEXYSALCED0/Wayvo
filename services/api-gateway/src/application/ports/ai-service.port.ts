import { AIPlanRecommendationInput, AIPlanRecommendationResult } from '@wayvo/contracts';

export interface AiServicePort {
  /**
   * Dispatches trip planning to the AI recommendation engine (LangGraph multiagents).
   * If the service is in development or offline, returns a contract-compliant fallback plan.
   */
  generatePlan(input: AIPlanRecommendationInput, correlationId: string): Promise<AIPlanRecommendationResult>;
}
