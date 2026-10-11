import { Response } from 'express';
import { ApiResponse } from '@wayvo/contracts';
import {
  AlternativeNotFoundError,
  EventNotFoundError,
  InvalidDataError,
  InvalidTripStateError,
  TripNotFoundError,
} from '../../domain/errors';

// Traduce los errores del dominio a un código HTTP y al formato común
// { success: false, error: { code, message } }.
export function sendError(res: Response, error: unknown, defaultCode: string): void {
  const message = error instanceof Error ? error.message : 'Error inesperado';
  let status = 500;
  let code = defaultCode;

  if (
    error instanceof TripNotFoundError
    || error instanceof EventNotFoundError
    || error instanceof AlternativeNotFoundError
  ) {
    status = 404;
    code = 'NOT_FOUND';
  } else if (error instanceof InvalidTripStateError) {
    status = 409;
    code = 'INVALID_TRIP_STATE';
  } else if (
    error instanceof InvalidDataError
    || (error instanceof Error && error.name === 'ZodError')
  ) {
    status = 400;
    code = 'INVALID_DATA';
  }

  const body: ApiResponse = { success: false, error: { code, message } };
  res.status(status).json(body);
}
