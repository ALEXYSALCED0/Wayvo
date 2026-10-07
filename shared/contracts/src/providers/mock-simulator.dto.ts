export type MockSimulationMode = 'normal' | 'unavailable' | 'slow' | 'error';

export interface MockSimulationQuery {
  mode: MockSimulationMode;
  delayMs?: number;
  failureReason?: string;
}

export interface MockSimulationStatus {
  activeMode: MockSimulationMode;
  delayMs: number;
  failureReason?: string;
  updatedAt: string;
}
