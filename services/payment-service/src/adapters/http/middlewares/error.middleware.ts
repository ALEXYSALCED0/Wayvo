import { NextFunction, Request, Response } from 'express';
import { InvalidWebhookSignatureError, PaymentProviderError } from '../../payment/errors';
import {
  AlreadySubscribedError,
  ApplicationError,
  SubscriptionNotFoundError,
  UnauthenticatedError,
} from '../../../application/errors/application.error';
import { LoggerPort } from '../../../application/ports/logger.port';
import { DomainError } from '../../../domain/errors/domain.error';
import { RequestValidationError } from '../validation/validate';

// Traduce errores de cada capa a HTTP con el formato común del proyecto:
// { success: false, error: { code, message, details } }
function toHttp(err: Error): { status: number; code: string; details: unknown } {
  if (err instanceof RequestValidationError) return { status: 400, code: err.code, details: err.details };
  if (err instanceof InvalidWebhookSignatureError) return { status: 400, code: err.code, details: null };
  if (err instanceof UnauthenticatedError) return { status: 401, code: err.code, details: null };
  if (err instanceof SubscriptionNotFoundError) return { status: 404, code: err.code, details: null };
  if (err instanceof AlreadySubscribedError) return { status: 409, code: err.code, details: null };
  if (err instanceof PaymentProviderError) return { status: 502, code: err.code, details: null };
  if (err instanceof DomainError) return { status: 422, code: err.code, details: null };
  if (err instanceof ApplicationError) return { status: 400, code: err.code, details: null };
  if (err instanceof SyntaxError) return { status: 400, code: 'MALFORMED_JSON', details: null };
  return { status: 500, code: 'INTERNAL_ERROR', details: null };
}

export function errorMiddleware(logger: LoggerPort) {
  return (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
    const { status, code, details } = toHttp(err);
    const meta = { correlationId: res.locals.correlationId, code, error: err.message };
    if (status >= 500 && !(err instanceof PaymentProviderError)) logger.error('Unhandled error', meta);
    else logger.warn('Request failed', meta);

    res.status(status).json({
      success: false,
      error: { code, message: status === 500 ? 'Internal server error' : err.message, details },
    });
  };
}
