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
  at: Date;
}

export interface CompensationLogProps {
  id: string;
  correlationId: string;
  tripId: string | null;
  bookingId: string | null;
  failedStep: SagaStep;
  reason: string;
  entries: CompensationLogEntry[];
  createdAt: Date;
}

export interface OpenCompensationLogProps {
  id: string;
  correlationId: string;
  tripId: string | null;
  bookingId: string | null;
  failedStep: SagaStep;
  reason: string;
  now?: Date;
}

// Traza de una Saga que falló: qué paso falló, por qué, y el resultado de cada
// compensación ejecutada. Es la evidencia de la consistencia eventual.
export class CompensationLog {
  private constructor(private readonly props: CompensationLogProps) {}

  static open(input: OpenCompensationLogProps): CompensationLog {
    return new CompensationLog({
      id: input.id,
      correlationId: input.correlationId,
      tripId: input.tripId,
      bookingId: input.bookingId,
      failedStep: input.failedStep,
      reason: input.reason,
      entries: [],
      createdAt: input.now ?? new Date(),
    });
  }

  static restore(props: CompensationLogProps): CompensationLog {
    return new CompensationLog({ ...props, entries: [...props.entries] });
  }

  get id(): string { return this.props.id; }
  get correlationId(): string { return this.props.correlationId; }
  get tripId(): string | null { return this.props.tripId; }
  get bookingId(): string | null { return this.props.bookingId; }
  get failedStep(): SagaStep { return this.props.failedStep; }
  get reason(): string { return this.props.reason; }
  get entries(): readonly CompensationLogEntry[] { return this.props.entries; }
  get createdAt(): Date { return this.props.createdAt; }

  record(step: SagaStep, outcome: StepOutcome, detail: string | null = null, at: Date = new Date()): void {
    this.props.entries.push({ step, outcome, detail, at });
  }

  // true si todas las compensaciones registradas terminaron bien.
  isFullyCompensated(): boolean {
    return this.props.entries.length > 0
      && this.props.entries.every((e) => e.outcome === StepOutcome.SUCCEEDED);
  }

  toPrimitives(): CompensationLogProps {
    return { ...this.props, entries: this.props.entries.map((e) => ({ ...e })) };
  }
}