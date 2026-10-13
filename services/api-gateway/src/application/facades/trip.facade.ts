import {
  TripCheckoutRequest,
  TripCheckoutResponse,
  TripPlanRequest,
  TripPlanResponse,
} from '@wayvo/contracts';
import { AiServicePort } from '../ports/ai-service.port';
import { BookingServicePort } from '../ports/booking-service.port';

/**
 * GoF Structural Pattern: Facade
 *
 * TripFacade provides a unified, high-level interface over the subsystems
 * required for trip lifecycle management:
 * 1. AI Recommendation Engine (LangGraph multiagents in Python)
 * 2. Booking Service (Saga Orchestrator with automatic compensation)
 *
 * Benefits:
 * - Decouples frontend client (Web & Mobile) from internal microservices topologies.
 * - Drastically reduces network round-trips between client and internal services.
 * - Prevents the God Object anti-pattern by focusing specifically on Trip Orchestration.
 */
export class TripFacade {
  constructor(
    private readonly aiService: AiServicePort,
    private readonly bookingService: BookingServicePort,
  ) {}

  /**
   * Facade Method 1: Plan Trip
   * Triggers the multiagent AI system to analyze personality, budget, transport,
   * gastronomy and activities, producing a consolidated itinerary and draft booking items.
   */
  async planTrip(request: TripPlanRequest, correlationId: string): Promise<TripPlanResponse> {
    const plan = await this.aiService.generatePlan(request, correlationId);
    return { plan };
  }

  /**
   * Facade Method 2: Checkout Trip
   * Triggers the distributed Saga Orchestrator across trip-service, booking-service
   * and provider-service with automatic compensation (rollback) if any provider fails.
   */
  async checkoutTrip(request: TripCheckoutRequest, correlationId: string): Promise<TripCheckoutResponse> {
    const sagaResult = await this.bookingService.executeConfirmTripSaga(request, correlationId);
    return { saga: sagaResult };
  }
}
