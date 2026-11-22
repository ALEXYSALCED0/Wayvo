import { User } from '../../domain/entities/user';
import { UserRepository } from '../../domain/repositories/user.repository';

// Implementación en memoria (tests y desarrollo sin base de datos).
export class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, User>();

  async save(user: User): Promise<void> {
    this.users.set(user.id, user);
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return [...this.users.values()].find((u) => u.email === email) ?? null;
  }
}
