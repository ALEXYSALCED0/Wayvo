import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SLOW_DELAY_MS,
  MAX_DELAY_MS,
  MockSimulationState,
  parseSimulationQuery,
} from '../../../src/infrastructure/mock/simulation-state';

const fixed = new Date('2026-10-10T10:00:00Z');

describe('MockSimulationState', () => {
  it('arranca en normal, o en el modo válido recibido', () => {
    expect(new MockSimulationState(undefined, () => fixed).status().activeMode).toBe('normal');
    expect(new MockSimulationState('nonsense', () => fixed).status().activeMode).toBe('normal');
    expect(new MockSimulationState('unavailable', () => fixed).status().activeMode).toBe('unavailable');
  });

  it('slow usa el retardo por defecto y los demás modos lo ignoran', () => {
    const state = new MockSimulationState(undefined, () => fixed);
    expect(state.update({ mode: 'slow' }).delayMs).toBe(DEFAULT_SLOW_DELAY_MS);
    expect(state.update({ mode: 'slow', delayMs: 1200 }).delayMs).toBe(1200);
    expect(state.update({ mode: 'error', delayMs: 1200 }).delayMs).toBe(0);
  });

  it('guarda el motivo del fallo y reset lo borra', () => {
    const state = new MockSimulationState(undefined, () => fixed);
    expect(state.update({ mode: 'unavailable', failureReason: 'Sin cupo' }).failureReason).toBe('Sin cupo');
    const status = state.reset();
    expect(status.activeMode).toBe('normal');
    expect(status.failureReason).toBeUndefined();
  });

  it('rechaza un modo desconocido', () => {
    const state = new MockSimulationState();
    expect(() => state.update({ mode: 'boom' as never })).toThrow(RangeError);
  });
});

describe('parseSimulationQuery', () => {
  it('sin parámetros: solo consulta', () => {
    expect(parseSimulationQuery({})).toEqual({ ok: true });
  });

  it('modo válido con delay y motivo', () => {
    expect(parseSimulationQuery({ mode: 'slow', delayMs: '3000', failureReason: 'x' })).toEqual({
      ok: true,
      update: { mode: 'slow', delayMs: 3000, failureReason: 'x' },
    });
  });

  it('reporta todos los errores', () => {
    const result = parseSimulationQuery({ mode: 'bad', delayMs: String(MAX_DELAY_MS + 1) });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.details).toHaveLength(2);
  });

  it('delayMs sin mode es inválido', () => {
    expect(parseSimulationQuery({ delayMs: '10' }).ok).toBe(false);
  });

  it('delayMs no numérico o negativo es inválido', () => {
    expect(parseSimulationQuery({ mode: 'slow', delayMs: 'abc' }).ok).toBe(false);
    expect(parseSimulationQuery({ mode: 'slow', delayMs: '-1' }).ok).toBe(false);
  });
});
