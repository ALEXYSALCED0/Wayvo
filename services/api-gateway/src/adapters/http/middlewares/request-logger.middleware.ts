import { Request, Response, NextFunction } from 'express';
import { CORRELATION_ID_HEADER } from '@wayvo/contracts';

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const correlationId = (req.headers[CORRELATION_ID_HEADER] as string) || 'unknown';

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const logColor = statusCode >= 500 ? '\x1b[31m' : statusCode >= 400 ? '\x1b[33m' : '\x1b[32m';
    const resetColor = '\x1b[0m';

    console.log(
      `[API Gateway] ${new Date().toISOString()} | [${correlationId}] ${req.method} ${req.originalUrl} -> ${logColor}${statusCode}${resetColor} (${duration}ms)`,
    );
  });

  next();
}
