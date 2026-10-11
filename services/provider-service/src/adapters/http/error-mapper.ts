import type { ApiResponse } from '@wayvo/contracts';
import { AdapterMappingError, AdapterNotRegisteredError, ExternalProviderError } from '../external/errors';
import { ApplicationError, ProviderNotFoundError, ReservationRejectedError } from '../../application/errors/application.error';
import { DomainError, InsufficientCapacityError } from '../../domain/errors/domain.error';
import { RequestValidationError } from './schemas';
import { fail } from './presenters';

export interface HttpFailure {
  status: number;
  body: ApiResponse<never>;
  unexpected: boolean;
}

// de error a respuesta HTTP
export function toHttpFailure(error: unknown): HttpFailure {
  if (error instanceof RequestValidationError) {
    return { status: 400, body: fail(error.code, error.message, error.details), unexpected: false };
  }
  // El proveedor no tiene cupo o rechazó, la Saga compensa
  if (error instanceof ReservationRejectedError || error instanceof InsufficientCapacityError) {
    return { status: 409, body: fail(error.code, error.message), unexpected: false };
  }
  if (error instanceof ProviderNotFoundError) {
    return { status: 404, body: fail(error.code, error.message), unexpected: false };
  }
  if (error instanceof ApplicationError || error instanceof DomainError) {
    return { status: 400, body: fail(error.code, error.message), unexpected: false };
  }
  // La API externa falló o no respondió
  if (error instanceof ExternalProviderError) {
    return {
      status: 502,
      body: fail(error.code, error.message, { provider: error.provider }),
      unexpected: false,
    };
  }
  // La oferta no tiene los datos para consultar al proveedor
  if (error instanceof AdapterMappingError) {
    return { status: 422, body: fail(error.code, error.message), unexpected: false };
  }
  // Tipo de oferta sin adapter
  if (error instanceof AdapterNotRegisteredError) {
    return { status: 501, body: fail(error.code, error.message), unexpected: false };
  }
  return { status: 500, body: fail('INTERNAL_ERROR', 'Internal server error'), unexpected: true };
}
