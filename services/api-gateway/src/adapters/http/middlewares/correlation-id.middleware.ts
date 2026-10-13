import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { CORRELATION_ID_HEADER } from '@wayvo/contracts';

/**
 * Ensures distributed tracing by enforcing 'x-correlation-id'
 * across all inbound and downstream proxied requests.
 */
export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.headers[CORRELATION_ID_HEADER] as string | undefined;
  const correlationId = incomingId && incomingId.trim().length > 0 ? incomingId.trim() : randomUUID();

  // Attach to request and response headers
  req.headers[CORRELATION_ID_HEADER] = correlationId;
  res.setHeader(CORRELATION_ID_HEADER, correlationId);

  next();
}
