import { User } from '../../domain/entities/user';
import { UserRepository } from '../../domain/repositories/user.repository';
import { AuthSessionOutput, toAuthSessionOutput } from '../dtos/auth.dto';
import { InvalidCredentialsError } from '../errors/application.error';
import { LoggerPort } from '../ports/logger.port';
import { PasswordHasher } from '../ports/password-hasher.port';
import { TokenService } from '../ports/token-service.port';

export interface LoginUserInput {
  email: string;
  password: string;
}

// Caso de uso: verificar credenciales y emitir un token de acceso.
export class LoginUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
    private readonly logger: LoggerPort,
  ) {}

  async execute(input: LoginUserInput): Promise<AuthSessionOutput> {
    const user = await this.users.findByEmail(User.normalizeEmail(input.email));

    // Si el correo no existe o la contraseña no coincide, el error es el mismo.
    const valid = user !== null && (await this.hasher.compare(input.password, user.passwordHash));
    if (!user || !valid) {
      this.logger.warn('Login rejected', { reason: 'invalid credentials' });
      throw new InvalidCredentialsError();
    }

    this.logger.info('User logged in', { userId: user.id });

    const issued = this.tokens.issue({ sub: user.id, email: user.email, name: user.name, role: user.role });
    return toAuthSessionOutput(user, issued);
  }
}
