import { ConfirmTripSagaInput, ConfirmTripSagaResult } from '@wayvo/contracts';

export interface BookingServicePort {
  /**
   * Dispatches trip confirmation to the Booking Service Saga Orchestrator.
   * Handles forward execution and rollback/compensation traces.
   */
  executeConfirmTripSaga(input: ConfirmTripSagaInput, correlationId: string): Promise<ConfirmTripSagaResult>;
}
