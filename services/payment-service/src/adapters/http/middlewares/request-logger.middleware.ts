import { NextFunction, Request, Response } from 'express';
import { LoggerPort } from '../../../application/ports/logger.port';

export function requestLoggerMiddleware(logger: LoggerPort) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();
    res.on('finish', () => {
      logger.info('HTTP request', {
        correlationId: res.locals.correlationId,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs: Date.now() - start,
      });
    });
    next();
  };
}