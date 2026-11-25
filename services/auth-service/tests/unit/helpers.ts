import { IdGenerator } from '../../src/application/ports/id-generator.port';
import { LoggerPort } from '../../src/application/ports/logger.port';
import { PasswordHasher } from '../../src/application/ports/password-hasher.port';
import { JwtTokenService } from '../../src/infrastructure/token/jwt-token.service';

export const TEST_SECRET = 'secreto-de-prueba';

export const silentLogger: LoggerPort = { info: () => {}, warn: () => {}, error: () => {} };

export class SequentialIdGenerator implements IdGenerator {
  private n = 0;
  generate(): string {
    this.n += 1;
    return `user-${this.n}`;
  }
}

// Hasher falso y rápido para tests de casos de uso (no prueba bcrypt, prueba la lógica).
export class FakePasswordHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    return `hashed:${plain}`;
  }
  async compare(plain: string, hash: string): Promise<boolean> {
    return hash === `hashed:${plain}`;
  }
}

export const testTokens = () => new JwtTokenService(TEST_SECRET, 3600);
