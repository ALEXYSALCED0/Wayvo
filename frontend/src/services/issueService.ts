/**
 * Issue Service (Simulates Backend Mediator Coordination)
 * 
 * In the future, this mock method will be replaced by:
 * API request -> Backend -> GoF Mediator -> Microservices (Transit, Hotel, Activities, Notification) -> Response -> Frontend
 */

import { AlternativeOption, IssueScenarioType } from '../types/issue';
import { mockAlternativesMap } from '../data/mockData';

export interface RecalculationResult {
  scenarioId: IssueScenarioType;
  alternatives: AlternativeOption[];
  processingDurationMs: number;
}

class IssueService {
  /**
   * Reports an issue on a timeline item and requests recalculated alternatives.
   * Simulates realistic async network latency of the backend mediator.
   */
  async reportIssueAndRecalculate(
    tripId: string,
    affectedItemId: string,
    scenarioId: IssueScenarioType,
    customNote?: string
  ): Promise<RecalculationResult> {
    // Simulate backend Mediator coordination latency (e.g. 1.8 seconds)
    await new Promise((resolve) => setTimeout(resolve, 1800));

    const alternatives = mockAlternativesMap[scenarioId] || mockAlternativesMap.missed_train;

    return {
      scenarioId,
      alternatives: [...alternatives],
      processingDurationMs: 1800,
    };
  }
}

export const issueService = new IssueService();
