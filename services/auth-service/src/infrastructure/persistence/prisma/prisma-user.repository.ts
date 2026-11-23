import { AccountPlan, User, UserRole } from '../../../domain/entities/user';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { Prisma, PrismaClient } from './prisma.client';

type UserRow = Prisma.UserGetPayload<object>;

function toDomain(row: UserRow): User {
  return User.restore({
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.passwordHash,
    role: row.role as UserRole,
    createdAt: row.createdAt,
    plan: row.plan as AccountPlan,
    planSubscriptionId: row.planSubscriptionId,
    planExpiresAt: row.planExpiresAt,
  });
}

// Implementación real del puerto UserRepository sobre PostgreSQL (Auth DB).
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(user: User): Promise<void> {
    const data = {
      email: user.email,
      name: user.name,
      passwordHash: user.passwordHash,
      role: user.role,
      createdAt: user.createdAt,
      plan: user.plan,
      planSubscriptionId: user.planSubscriptionId,
      planExpiresAt: user.planExpiresAt,
    };
    await this.prisma.user.upsert({
      where: { id: user.id },
      create: { id: user.id, ...data },
      update: data,
    });
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? toDomain(row) : null;
  }
}
