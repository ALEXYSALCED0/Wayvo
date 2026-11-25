import bcrypt from 'bcryptjs';
import { PasswordHasher } from '../../application/ports/password-hasher.port';

// Implementación del puerto PasswordHasher con bcrypt.
// bcrypt agrega una "sal" aleatoria a cada hash: dos usuarios con la misma
// contraseña tienen hashes distintos, y el hash no se puede revertir.
export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly rounds = 10) {}

  hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, this.rounds);
  }

  compare(plainPassword: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, passwordHash);
  }
}
