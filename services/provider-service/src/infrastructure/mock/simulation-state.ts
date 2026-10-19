// GET /api/v1/mock/simulate-failure?mode=...
//   normal       responde bien, retardo realista
//   unavailable  el proveedor no tiene cupo, reservas rechazadas
//   slow         responde bien pero tarda
//   error        el proveedor está caído

export const MOCK_SIMULATION_MODES = ['normal', 'unavailable', 'slow', 'error'] as const;
export type MockSimulationMode = (typeof MOCK_SIMULATION_MODES)[number];

export const DEFAULT_SLOW_DELAY_MS = 5_000;
export const MAX_DELAY_MS = 30_000;
export const MAX_REASON_LENGTH = 200;

export interface MockSimulationStatus {
  activeMode: MockSimulationMode;
  delayMs: number;
  failureReason?: string;
  updatedAt: string;
}

export interface MockSimulationUpdate {
  mode: MockSimulationMode;
  delayMs?: number;
  failureReason?: string;
}

export function isMockMode(value: unknown): value is MockSimulationMode {
  return typeof value === 'string' && (MOCK_SIMULATION_MODES as readonly string[]).includes(value);
}

export class MockSimulationState {
  private mode: MockSimulationMode;
  private delayMs: number;
  private failureReason: string | undefined;
  private updatedAt: Date;

  // `initialMode` viene de SIMULATE_FAILURE_MODE, si es no válido arranca en normal
  constructor(initialMode?: string, private readonly now: () => Date = () => new Date()) {
    this.mode = isMockMode(initialMode) ? initialMode : 'normal';
    this.delayMs = this.mode === 'slow' ? DEFAULT_SLOW_DELAY_MS : 0;
    this.failureReason = undefined;
    this.updatedAt = now();
  }

  status(): MockSimulationStatus {
    return {
      activeMode: this.mode,
      delayMs: this.delayMs,
      ...(this.failureReason !== undefined && { failureReason: this.failureReason }),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  update(update: MockSimulationUpdate): MockSimulationStatus {
    if (!isMockMode(update.mode)) throw new RangeError(`Unknown simulation mode: ${String(update.mode)}`);
    this.mode = update.mode;
    // El retardo solo aplica en "slow"; en los demás modos se ignora
    this.delayMs = update.mode === 'slow' ? update.delayMs ?? DEFAULT_SLOW_DELAY_MS : 0;
    this.failureReason = update.failureReason;
    this.updatedAt = this.now();
    return this.status();
  }

  reset(): MockSimulationStatus {
    return this.update({ mode: 'normal' });
  }
}

export type ParsedSimulationQuery =
  | { ok: true; update?: MockSimulationUpdate } // sin update para ver el estado
  | { ok: false; details: string[] };

export function parseSimulationQuery(query: Record<string, unknown>): ParsedSimulationQuery {
  const { mode, delayMs, failureReason } = query;
  if (mode === undefined) {
    return delayMs !== undefined || failureReason !== undefined
      ? { ok: false, details: ['mode is required when delayMs or failureReason are given'] }
      : { ok: true };
  }

  const details: string[] = [];
  if (!isMockMode(mode)) {
    details.push(`mode must be one of: ${MOCK_SIMULATION_MODES.join(', ')}`);
  }

  let parsedDelay: number | undefined;
  if (delayMs !== undefined) {
    parsedDelay = typeof delayMs === 'string' && delayMs.trim() !== '' ? Number(delayMs) : NaN;
    if (!Number.isInteger(parsedDelay) || parsedDelay < 0 || parsedDelay > MAX_DELAY_MS) {
      details.push(`delayMs must be an integer between 0 and ${MAX_DELAY_MS}`);
    }
  }

  if (failureReason !== undefined && (typeof failureReason !== 'string' || failureReason.length > MAX_REASON_LENGTH)) {
    details.push(`failureReason must be a text of at most ${MAX_REASON_LENGTH} characters`);
  }

  if (details.length > 0) return { ok: false, details };
  return {
    ok: true,
    update: {
      mode: mode as MockSimulationMode,
      ...(parsedDelay !== undefined && { delayMs: parsedDelay }),
      ...(failureReason !== undefined && { failureReason: failureReason as string }),
    },
  };
}
