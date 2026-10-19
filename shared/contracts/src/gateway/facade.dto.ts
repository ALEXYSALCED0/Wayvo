import { ConfirmTripSagaInput, ConfirmTripSagaResult } from '../bookings/saga.dto';
import { AIPlanRecommendationInput, AIPlanRecommendationResult } from '../profiles/ai-agent.dto';

/**
 * TripFacade Endpoint 1: POST /api/v1/trips/plan
 * Encapsulates call to ai-recommendation (LangGraph multiagents)
 */
export type TripPlanRequest = AIPlanRecommendationInput;

export interface TripPlanResponse {
  plan: AIPlanRecommendationResult;
}

/**
 * TripFacade Endpoint 2: POST /api/v1/trips/checkout
 * Encapsulates call to booking-service (Saga Orchestrator)
 */
export type TripCheckoutRequest = ConfirmTripSagaInput;

export interface TripCheckoutResponse {
  saga: ConfirmTripSagaResult;
}
