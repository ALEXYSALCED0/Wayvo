import { UserRepository } from '../../domain/repositories/user.repository';
import { AuthUserOutput, toAuthUserOutput } from '../dtos/auth.dto';
import { InvalidTokenError, UserNotFoundError } from '../errors/application.error';
import { TokenService } from '../ports/token-service.port';

// Caso de uso: "¿quién soy?". El cliente lo usa al recargar la app para
// comprobar que el token guardado sigue siendo válido.
export class GetCurrentUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly tokens: TokenService,
  ) {}

  async execute(token: string | null): Promise<AuthUserOutput> {
    const claims = token ? this.tokens.verify(token) : null;
    if (!claims) throw new InvalidTokenError();

    const user = await this.users.findById(claims.sub);
    if (!user) throw new UserNotFoundError();

    return toAuthUserOutput(user);
  }
}
