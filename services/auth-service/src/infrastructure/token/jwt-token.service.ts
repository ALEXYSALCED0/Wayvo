import jwt from 'jsonwebtoken';
import { IssuedToken, TokenClaims, TokenService } from '../../application/ports/token-service.port';
import { UserRole } from '../../domain/entities/user';

const ISSUER = 'wayvo-auth-service';

// Implementación del puerto TokenService con JSON Web Tokens (HS256).
// El token va firmado con JWT_SECRET: cualquiera puede leer su contenido, pero
// nadie puede modificarlo sin invalidar la firma. El API Gateway verifica la firma
// con el mismo secreto, sin tener que llamar a auth-service en cada petición.
export class JwtTokenService implements TokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresInSeconds: number,
  ) {}

  issue(claims: TokenClaims): IssuedToken {
    const token = jwt.sign(
      { email: claims.email, name: claims.name, role: claims.role },
      this.secret,
      { algorithm: 'HS256', subject: claims.sub, issuer: ISSUER, expiresIn: this.expiresInSeconds },
    );
    return { token, expiresAt: new Date(Date.now() + this.expiresInSeconds * 1000) };
  }

  verify(token: string): TokenClaims | null {
    try {
      const payload = jwt.verify(token, this.secret, { algorithms: ['HS256'], issuer: ISSUER });
      if (typeof payload === 'string' || !payload.sub) return null;
      return {
        sub: payload.sub,
        email: String(payload.email),
        name: String(payload.name),
        role: payload.role === UserRole.ADMIN ? UserRole.ADMIN : UserRole.TRAVELER,
      };
    } catch {
      // Firma inválida, token mal formado o expirado.
      return null;
    }
  }
}
