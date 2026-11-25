import { User } from '../entities/user';

// Puerto de persistencia. El dominio y los casos de uso dependen de esta interfaz;
// la implementación (Prisma o memoria) vive en infrastructure/persistence.
export interface UserRepository {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
}
