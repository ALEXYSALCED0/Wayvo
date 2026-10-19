import { AdapterMappingError } from './errors';

type Metadata = Record<string, unknown> | undefined;

// Lectura de la metadata de la oferta, valida el tipo y lanza AdapterMappingError si falla

export function requireString(metadata: Metadata, key: string, offerId: string, fallback?: string): string {
  const value = metadata?.[key] ?? fallback;
  if (typeof value !== 'string' || value.trim() === '') {
    throw new AdapterMappingError(`Offer ${offerId} is missing metadata.${key}`);
  }
  return value;
}

export function optionalString(metadata: Metadata, key: string, offerId: string): string | undefined {
  const value = metadata?.[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    throw new AdapterMappingError(`Offer ${offerId} has an invalid metadata.${key}`);
  }
  return value;
}

export function optionalPositiveInt(metadata: Metadata, key: string, offerId: string): number | undefined {
  const value = metadata?.[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new AdapterMappingError(`Offer ${offerId} has an invalid metadata.${key}`);
  }
  return value;
}
