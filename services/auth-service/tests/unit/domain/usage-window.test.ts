import { isValidTimeZone, usageWindow } from '../../../src/domain/services/usage-window';

describe('usageWindow (mes calendario por zona horaria)', () => {
  const tz = 'America/Bogota'; // UTC-5, sin horario de verano

  it('mediados de mes: el periodo es ese mes y se renueva el día 1 a medianoche hora Bogotá', () => {
    const w = usageWindow(new Date('2026-11-23T15:42:00Z'), tz);
    expect(w.period).toBe('2026-11');
    expect(w.resetsAt.toISOString()).toBe('2026-12-01T05:00:00.000Z');
  });

  it('el límite del mes se cuenta en hora de Bogotá, no en UTC', () => {
    // 04:59:59Z del 1-dic = 23:59:59 del 30-nov en Bogotá: todavía es noviembre.
    expect(usageWindow(new Date('2026-12-01T04:59:59Z'), tz).period).toBe('2026-11');
    // 05:00:00Z = 00:00:00 del 1-dic en Bogotá: ya es diciembre.
    expect(usageWindow(new Date('2026-12-01T05:00:00Z'), tz).period).toBe('2026-12');
  });

  it('diciembre pasa a enero del año siguiente', () => {
    const w = usageWindow(new Date('2026-12-15T12:00:00Z'), tz);
    expect(w.period).toBe('2026-12');
    expect(w.resetsAt.toISOString()).toBe('2027-01-01T05:00:00.000Z');
  });

  it('valida zonas horarias', () => {
    expect(isValidTimeZone('America/Bogota')).toBe(true);
    expect(isValidTimeZone('No/Existe')).toBe(false);
  });
});
