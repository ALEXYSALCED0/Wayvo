import { AuthController } from '../adapters/http/controllers/auth.controller';
import { InternalController } from '../adapters/http/controllers/internal.controller';
import { IdGenerator } from '../application/ports/id-generator.port';
import { LoggerPort } from '../application/ports/logger.port';
import { PasswordHasher } from '../application/ports/password-hasher.port';
import { TokenService } from '../application/ports/token-service.port';
import { ConsumeAiPlanUseCase } from '../application/use-cases/consume-ai-plan.use-case';
import { ReleaseAiPlanUseCase } from '../application/use-cases/release-ai-plan.use-case';
import { GetCurrentUserUseCase } from '../application/use-cases/get-current-user.use-case';
import { LoginUserUseCase } from '../application/use-cases/login-user.use-case';
import { SetAccountPlanUseCase } from '../application/use-cases/set-account-plan.use-case';
import { RegisterUserUseCase } from '../application/use-cases/register-user.use-case';
import { PlanPolicy } from '../domain/policies/plan-policy';
import { AiPlanUsageRepository } from '../domain/repositories/ai-plan-usage.repository';
import { UserRepository } from '../domain/repositories/user.repository';
import { AppConfig } from './config/env';
import { BcryptPasswordHasher } from './crypto/bcrypt-password-hasher';
import { UuidGenerator } from './id/uuid.generator';
import { InMemoryAiPlanUsageRepository } from './persistence/in-memory-ai-plan-usage.repository';
import { InMemoryUserRepository } from './persistence/in-memory-user.repository';
import { createPrismaClient } from './persistence/prisma/prisma.client';
import { PrismaAiPlanUsageRepository } from './persistence/prisma/prisma-ai-plan-usage.repository';
import { PrismaUserRepository } from './persistence/prisma/prisma-user.repository';
import { JwtTokenService } from './token/jwt-token.service';

export interface Container {
  logger: LoggerPort;
  ids: IdGenerator;
  authController: AuthController;
  internalController: InternalController;
  internalToken: string;
  tokens: TokenService;
  persistence: 'postgres' | 'in-memory';
  shutdown(): Promise<void>;
}

// Permite a los tests reemplazar piezas concretas (p. ej. repositorio en memoria).
export interface ContainerOverrides {
  users?: UserRepository;
  usage?: AiPlanUsageRepository;
  now?: () => Date;
  hasher?: PasswordHasher;
  tokens?: TokenService;
  ids?: IdGenerator;
}

// Raíz de composición: el único lugar donde se eligen las implementaciones concretas.
export function buildContainer(config: AppConfig, logger: LoggerPort, overrides: ContainerOverrides = {}): Container {
  const prisma = !overrides.users && config.databaseUrl ? createPrismaClient(config.databaseUrl) : null;

  const users = overrides.users ?? (prisma ? new PrismaUserRepository(prisma) : new InMemoryUserRepository());
  const usage = overrides.usage ?? (prisma ? new PrismaAiPlanUsageRepository(prisma) : new InMemoryAiPlanUsageRepository());
  const policy = new PlanPolicy(config.freeAiPlansPerMonth);
  const hasher = overrides.hasher ?? new BcryptPasswordHasher(config.bcryptRounds);
  const tokens = overrides.tokens ?? new JwtTokenService(config.jwtSecret, config.jwtExpiresInSeconds);
  const ids = overrides.ids ?? new UuidGenerator();

  const authController = new AuthController(
    new RegisterUserUseCase(users, hasher, tokens, ids, logger, config.adminEmails),
    new LoginUserUseCase(users, hasher, tokens, logger),
    new GetCurrentUserUseCase(users, tokens, usage, policy, config.usageTimeZone, overrides.now),
  );

  const internalController = new InternalController(
    new SetAccountPlanUseCase(users, logger),
    new ConsumeAiPlanUseCase(users, usage, policy, config.usageTimeZone, logger, overrides.now),
    new ReleaseAiPlanUseCase(users, usage, policy, config.usageTimeZone, logger, overrides.now),
  );

  return {
    logger,
    ids,
    authController,
    internalController,
    internalToken: config.internalToken,
    tokens,
    persistence: prisma ? 'postgres' : 'in-memory',
    shutdown: async () => {
      await prisma?.$disconnect();
    },
  };
}
