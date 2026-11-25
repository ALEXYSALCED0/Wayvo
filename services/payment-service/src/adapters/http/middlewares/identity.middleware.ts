import { NextFunction, Request, Response } from 'express';
import { UnauthenticatedError } from '../../../application/errors/application.error';

export const USER_ID_HEADER = 'x-user-id';
export const USER_EMAIL_HEADER = 'x-user-email';
export const USER_NAME_HEADER = 'x-user-name';

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
  // Correo y nombre verificados del token (el gateway los escribe; el navegador no puede).
  const email = req.header(USER_EMAIL_HEADER)?.trim();
  if (email) res.locals.userEmail = email;
  const name = req.header(USER_NAME_HEADER);
  if (name) {
    try {
      res.locals.userName = decodeURIComponent(name);
    } catch {
      // nombre mal codificado: se ignora
    }
  }
  next();
}
