/**
 * Distributed Tracing & Correlation Contracts
 * Used across API Gateway, Booking Saga, Trip Mediator and Provider Adapters
 */

export const CORRELATION_ID_HEADER = 'x-correlation-id';

export interface CorrelationContext {
  correlationId: string;
  sourceService?: string;
  timestamp?: string;
}
