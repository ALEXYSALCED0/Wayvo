import { Request } from 'express';

// Header con el que el API Gateway propaga el usuario autenticado después de
// validar el JWT (USER_ID_HEADER en @wayvo/contracts). Solo el gateway lo escribe.
export const USER_ID_HEADER = 'x-user-id';

// Las llamadas internas entre servicios no pasan por el gateway y no lo traen.
export function requestUserId(req: Request): string | undefined {
  const value = req.header(USER_ID_HEADER);
  return value && value.trim() !== '' ? value : undefined;
}
