export enum SagaStep {
  CREATE_TRIP = 'CREATE_TRIP',
  CREATE_BOOKING = 'CREATE_BOOKING',
  RESERVE_PROVIDER = 'RESERVE_PROVIDER',
  CONFIRM = 'CONFIRM',
  COMPENSATE_BOOKING = 'COMPENSATE_BOOKING',
  COMPENSATE_TRIP = 'COMPENSATE_TRIP',
}

export enum StepOutcome {
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
}

export interface CompensationLogEntry {
  step: SagaStep;
  outcome: StepOutcome;
  detail: string | null;
  at: string | Date;
}

export interface CompensationLogProps {
  id: string;
  correlationId: string;
  tripId: string | null;
  bookingId: string | null;
  failedStep: SagaStep;
  reason: string;
  entries: CompensationLogEntry[];
  createdAt: string | Date;
}

export interface CompensationLogOutput {
  id: string;
  correlationId: string;
  tripId: string | null;
  bookingId: string | null;
  failedStep: SagaStep;
  reason: string;
  entries: CompensationLogEntry[];
  createdAt: string;
}
