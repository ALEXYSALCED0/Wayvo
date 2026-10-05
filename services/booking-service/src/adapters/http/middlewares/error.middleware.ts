import { NextFunction, Request, Response } from 'express';
import { LoggerPort } from '../../../application/ports/logger.port';

// Respuesta homogénea { success: false, error: { code, message, details } }
// (mismo formato que usará el api-gateway).
export function errorMiddleware(logger: LoggerPort) {
  return (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
    logger.error('Unhandled error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: err.message, details: null },
    });
  };
}