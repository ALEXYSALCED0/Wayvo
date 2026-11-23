import { NextFunction, Request, Response } from 'express';
import { UnauthenticatedError } from '../../../application/errors/application.error';

export const USER_ID_HEADER = 'x-user-id';

// El api-gateway verifica el JWT y manda el usuario en x-user-id (borrando el que
// venga del navegador). Este servicio no se expone a Internet: solo recibe tráfico del gateway
// o de la Saga. La identidad NUNCA se toma del cuerpo de la petición.
export function identityMiddleware(req: Request, res: Response, next: NextFunction): void {
  const userId = req.header(USER_ID_HEADER)?.trim();
  if (!userId) {
    next(new UnauthenticatedError());
    return;
  }
  res.locals.userId = userId;
  next();
}
