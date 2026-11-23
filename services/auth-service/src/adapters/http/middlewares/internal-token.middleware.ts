import { timingSafeEqual } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';
import { ApplicationError } from '../../../application/errors/application.error';

export const INTERNAL_TOKEN_HEADER = 'x-internal-token';

export class InvalidInternalTokenError extends ApplicationError {
  readonly code = 'INVALID_INTERNAL_TOKEN';

  constructor() {
    super('Token interno inválido');
  }
}

// Protege las rutas internas (servicio a servicio). El api-gateway NO las expone al
// navegador; aun así, se exige el token compartido por si alguien llega a la red interna.
export function internalTokenMiddleware(expected: string) {
  const expectedBuffer = Buffer.from(expected);
  return (req: Request, _res: Response, next: NextFunction): void => {
    const given = Buffer.from(req.header(INTERNAL_TOKEN_HEADER) ?? '');
    const valid = given.length === expectedBuffer.length && timingSafeEqual(given, expectedBuffer);
    next(valid ? undefined : new InvalidInternalTokenError());
  };
}
