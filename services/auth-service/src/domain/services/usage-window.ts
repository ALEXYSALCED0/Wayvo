// Mes calendario en una zona horaria: a qué mes pertenece un instante y cuándo empieza el siguiente.
// Los planes de IA de las cuentas FREE se cuentan por mes calendario; al empezar un mes nuevo,
// el contador arranca en cero (es una fila nueva, no hay nada que "reiniciar").
export interface UsageWindow {
  // "2026-11"
  period: string;
  // Primer instante del mes siguiente (cuándo se renuevan los planes).
  resetsAt: Date;
}

interface LocalParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function localParts(date: Date, timeZone: string): LocalParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

// Diferencia (ms) entre la hora local de la zona y UTC en ese instante.
function offsetMs(date: Date, timeZone: string): number {
  const p = localParts(date, timeZone);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(date.getTime() / 1000) * 1000;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function usageWindow(now: Date, timeZone: string): UsageWindow {
  const p = localParts(now, timeZone);
  const period = `${p.year}-${String(p.month).padStart(2, '0')}`;

  const nextYear = p.month === 12 ? p.year + 1 : p.year;
  const nextMonth = p.month === 12 ? 1 : p.month + 1;
  const localMidnight = Date.UTC(nextYear, nextMonth - 1, 1);
  // Dos pasadas: la segunda corrige el desfase si hay cambio de horario cerca del límite.
  let instant = localMidnight - offsetMs(new Date(localMidnight), timeZone);
  instant = localMidnight - offsetMs(new Date(instant), timeZone);

  return { period, resetsAt: new Date(instant) };
}
