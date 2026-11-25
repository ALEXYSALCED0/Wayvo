import { NextFunction, Request, Response } from 'express';
import { USER_ID_HEADER } from '@wayvo/contracts';
import { TripService } from '../../application/services/TripService';
import { sendError } from '../controllers/httpError';

// Identidad del usuario que el API Gateway propagó después de validar el JWT.
// Las peticiones internas entre servicios (p. ej. la Saga de booking-service
// confirmando o cancelando un viaje) no pasan por el gateway y no la traen.
export function requestUserId(req: Request): string | undefined {
  const value = req.header(USER_ID_HEADER);
  return value && value.trim() !== '' ? value : undefined;
}

// Antes de cualquier ruta /api/v1/trips/:id comprueba que el viaje sea del usuario.
// Si es de otro usuario responde 404 (como si no existiera).
export function requireTripOwnership(tripService: TripService) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = requestUserId(req);
    if (!userId) {
      next(); // llamada interna entre servicios
      return;
    }
    try {
      await tripService.getTripForUser(req.params.id, userId);
      next();
    } catch (error) {
      sendError(res, error, 'TRIP_QUERY_FAILED');
    }
  };
}
