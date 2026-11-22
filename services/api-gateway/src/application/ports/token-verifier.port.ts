import { UserRole } from '@wayvo/contracts';

// Identidad del usuario que hace la petición, obtenida del token.
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// Puerto: el gateway necesita "verificar un token", sin depender de cómo
// (JWT, sesiones, un proveedor externo...). La implementación vive en infrastructure/auth.
export interface TokenVerifier {
  // Devuelve el usuario si el token es válido y no expiró; si no, null.
  verify(token: string): AuthenticatedUser | null;
}
