import { User, UserRole } from '../../domain/entities/user';
import { UserRepository } from '../../domain/repositories/user.repository';
import { AuthSessionOutput, toAuthSessionOutput } from '../dtos/auth.dto';
import { EmailAlreadyRegisteredError } from '../errors/application.error';
import { IdGenerator } from '../ports/id-generator.port';
import { LoggerPort } from '../ports/logger.port';
import { PasswordHasher } from '../ports/password-hasher.port';
import { TokenService } from '../ports/token-service.port';

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

// Caso de uso: crear una cuenta y dejar al usuario con la sesión iniciada.
export class RegisterUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
    private readonly ids: IdGenerator,
    private readonly logger: LoggerPort,
    // Correos que reciben rol ADMIN al registrarse (configuración, p. ej. ADMIN_EMAILS).
    private readonly adminEmails: ReadonlySet<string> = new Set(),
  ) {}

  async execute(input: RegisterUserInput): Promise<AuthSessionOutput> {
    const email = User.normalizeEmail(input.email);

    if (await this.users.findByEmail(email)) {
      throw new EmailAlreadyRegisteredError();
    }

    const user = User.register({
      id: this.ids.generate(),
      email,
      name: input.name,
      passwordHash: await this.hasher.hash(input.password),
      role: this.adminEmails.has(email) ? UserRole.ADMIN : UserRole.TRAVELER,
    });
    await this.users.save(user);

    this.logger.info('User registered', { userId: user.id, role: user.role });

    const issued = this.tokens.issue({ sub: user.id, email: user.email, name: user.name, role: user.role });
    return toAuthSessionOutput(user, issued);
  }
}
