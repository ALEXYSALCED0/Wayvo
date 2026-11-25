import { NextFunction, Request, Response } from 'express';
import { IdGenerator } from '../../../application/ports/id-generator.port';

export const CORRELATION_HEADER = 'x-correlation-id';

// Toma el X-Correlation-Id que manda el api-gateway o genera uno nuevo.
// Lo deja en res.locals y lo devuelve en la respuesta para poder rastrear la petición.
export function correlationIdMiddleware(ids: IdGenerator) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const incoming = req.header(CORRELATION_HEADER);
    const correlationId = incoming && incoming.trim() !== '' ? incoming : ids.generate();
    res.locals.correlationId = correlationId;
    res.setHeader('X-Correlation-Id', correlationId);
    next();
  };
}