import { UserRole } from '../../domain/entities/user';

// Identidad que se guarda dentro del token.
export interface TokenClaims {
  sub: string; // id del usuario
  email: string;
  name: string;
  role: UserRole;
}

export interface IssuedToken {
  token: string;
  expiresAt: Date;
}

// Emite y verifica tokens de acceso. La implementación (JWT) vive en infrastructure/token.
export interface TokenService {
  issue(claims: TokenClaims): IssuedToken;
  // Devuelve los claims si el token es válido y no expiró; si no, null.
  verify(token: string): TokenClaims | null;
}
