// Textos y formatos del plan de la cuenta (FREE / PREMIUM).

export const formatUsd = (amountCents: number, currency = 'usd'): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(amountCents / 100);

export const formatDate = (iso: string | null | undefined): string =>
  iso
    ? new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Bogota' })
    : '—';

// "1 de diciembre": cuándo se renuevan los planes del mes.
export const formatResetDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', timeZone: 'America/Bogota' });
