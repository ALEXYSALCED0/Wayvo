import jwt from 'jsonwebtoken';
import { UserRole } from '@wayvo/contracts';
import { AuthenticatedUser, TokenVerifier } from '../../application/ports/token-verifier.port';

const ISSUER = 'wayvo-auth-service';

// Verifica la firma del JWT emitido por auth-service usando el secreto compartido.
// No llama a auth-service: el token se valida localmente (autenticación stateless),
// así el gateway no agrega una petición extra por cada request.
export class JwtTokenVerifier implements TokenVerifier {
  constructor(private readonly secret: string) {}

  verify(token: string): AuthenticatedUser | null {
    try {
      const payload = jwt.verify(token, this.secret, { algorithms: ['HS256'], issuer: ISSUER });
      if (typeof payload === 'string' || !payload.sub) return null;
      return {
        id: payload.sub,
        email: String(payload.email ?? ''),
        name: String(payload.name ?? ''),
        role: payload.role === UserRole.ADMIN ? UserRole.ADMIN : UserRole.TRAVELER,
      };
    } catch {
      return null;
    }
  }
}
