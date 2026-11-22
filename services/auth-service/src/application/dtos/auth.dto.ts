import { User, UserRole } from '../../domain/entities/user';
import { IssuedToken } from '../ports/token-service.port';

// Forma pública del usuario (coincide con AuthUserDTO de @wayvo/contracts).
// Nunca incluye passwordHash.
export interface AuthUserOutput {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthSessionOutput {
  token: string;
  expiresAt: string;
  user: AuthUserOutput;
}

export function toAuthUserOutput(user: User): AuthUserOutput {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

export function toAuthSessionOutput(user: User, issued: IssuedToken): AuthSessionOutput {
  return {
    token: issued.token,
    expiresAt: issued.expiresAt.toISOString(),
    user: toAuthUserOutput(user),
  };
}
