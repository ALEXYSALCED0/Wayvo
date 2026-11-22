import { NextFunction, Request, Response } from 'express';
import { USER_ID_HEADER, USER_ROLE_HEADER, UserRole } from '@wayvo/contracts';
import { AuthenticatedUser, TokenVerifier } from '../../../application/ports/token-verifier.port';
import { ForbiddenError, UnauthorizedError } from '../../../domain/errors/gateway.error';

// Rutas que se pueden usar sin iniciar sesión.
const PUBLIC_ROUTES: Array<{ method: string; path: RegExp }> = [
  { method: 'GET', path: /^\/health(\/.*)?$/ },
  { method: 'POST', path: /^\/api\/v1\/auth\/(register|login)$/ },
];

// Rutas que además exigen rol ADMIN (herramientas de demostración / caos).
const ADMIN_ROUTES: RegExp[] = [/^\/api\/v1\/mock(\/.*)?$/];

function isPublic(req: Request): boolean {
  if (req.method === 'OPTIONS') return true; // preflight de CORS
  return PUBLIC_ROUTES.some((r) => r.method === req.method && r.path.test(req.path));
}

function bearerToken(req: Request): string | null {
  const header = req.header('authorization');
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
}

/**
 * Middleware de autenticación del API Gateway (punto único de entrada).
 *
 * 1. Borra cualquier x-user-id / x-user-role que venga del cliente: solo el gateway
 *    puede escribirlos, así nadie puede hacerse pasar por otro usuario.
 * 2. Deja pasar las rutas públicas (health, registro, login).
 * 3. En el resto exige "Authorization: Bearer <token>" válido (401 si no).
 * 4. Propaga la identidad a los microservicios internos con los headers
 *    x-user-id y x-user-role, y la deja en res.locals.user para la Facade.
 * 5. Si el cuerpo JSON trae un campo userId, lo reemplaza por el del token:
 *    el cliente no puede crear viajes o reservas a nombre de otro.
 */
export function createAuthMiddleware(verifier: TokenVerifier) {
  return (req: Request, res: Response, next: NextFunction): void => {
    delete req.headers[USER_ID_HEADER];
    delete req.headers[USER_ROLE_HEADER];

    if (isPublic(req)) {
      next();
      return;
    }

    const token = bearerToken(req);
    const user = token ? verifier.verify(token) : null;
    if (!user) {
      next(new UnauthorizedError(token ? 'La sesión no es válida o expiró. Inicia sesión de nuevo' : undefined));
      return;
    }

    if (ADMIN_ROUTES.some((r) => r.test(req.path)) && user.role !== UserRole.ADMIN) {
      next(new ForbiddenError('Solo un administrador puede usar las herramientas de simulación'));
      return;
    }

    req.headers[USER_ID_HEADER] = user.id;
    req.headers[USER_ROLE_HEADER] = user.role;
    res.locals.user = user;

    if (req.body && typeof req.body === 'object' && !Array.isArray(req.body) && 'userId' in req.body) {
      req.body.userId = user.id;
    }

    next();
  };
}

// Usuario autenticado de la petición actual (lo dejó el middleware).
export function currentUser(res: Response): AuthenticatedUser {
  const user = res.locals.user as AuthenticatedUser | undefined;
  if (!user) throw new UnauthorizedError();
  return user;
}
