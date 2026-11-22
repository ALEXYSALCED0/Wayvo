import { AuthController } from '../adapters/http/controllers/auth.controller';
import { IdGenerator } from '../application/ports/id-generator.port';
import { LoggerPort } from '../application/ports/logger.port';
import { PasswordHasher } from '../application/ports/password-hasher.port';
import { TokenService } from '../application/ports/token-service.port';
import { GetCurrentUserUseCase } from '../application/use-cases/get-current-user.use-case';
import { LoginUserUseCase } from '../application/use-cases/login-user.use-case';
import { RegisterUserUseCase } from '../application/use-cases/register-user.use-case';
import { UserRepository } from '../domain/repositories/user.repository';
import { AppConfig } from './config/env';
import { BcryptPasswordHasher } from './crypto/bcrypt-password-hasher';
import { UuidGenerator } from './id/uuid.generator';
import { InMemoryUserRepository } from './persistence/in-memory-user.repository';
import { createPrismaClient } from './persistence/prisma/prisma.client';
import { PrismaUserRepository } from './persistence/prisma/prisma-user.repository';
import { JwtTokenService } from './token/jwt-token.service';

export interface Container {
  logger: LoggerPort;
  ids: IdGenerator;
  authController: AuthController;
  tokens: TokenService;
  persistence: 'postgres' | 'in-memory';
  shutdown(): Promise<void>;
}

// Permite a los tests reemplazar piezas concretas (p. ej. repositorio en memoria).
export interface ContainerOverrides {
  users?: UserRepository;
  hasher?: PasswordHasher;
  tokens?: TokenService;
  ids?: IdGenerator;
}

// Raíz de composición: el único lugar donde se eligen las implementaciones concretas.
export function buildContainer(config: AppConfig, logger: LoggerPort, overrides: ContainerOverrides = {}): Container {
  const prisma = !overrides.users && config.databaseUrl ? createPrismaClient(config.databaseUrl) : null;

  const users = overrides.users ?? (prisma ? new PrismaUserRepository(prisma) : new InMemoryUserRepository());
  const hasher = overrides.hasher ?? new BcryptPasswordHasher(config.bcryptRounds);
  const tokens = overrides.tokens ?? new JwtTokenService(config.jwtSecret, config.jwtExpiresInSeconds);
  const ids = overrides.ids ?? new UuidGenerator();

  const authController = new AuthController(
    new RegisterUserUseCase(users, hasher, tokens, ids, logger, config.adminEmails),
    new LoginUserUseCase(users, hasher, tokens, logger),
    new GetCurrentUserUseCase(users, tokens),
  );

  return {
    logger,
    ids,
    authController,
    tokens,
    persistence: prisma ? 'postgres' : 'in-memory',
    shutdown: async () => {
      await prisma?.$disconnect();
    },
  };
}
