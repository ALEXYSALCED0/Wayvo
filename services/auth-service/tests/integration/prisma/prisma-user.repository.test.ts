import { User, UserRole } from '../../../src/domain/entities/user';
import { createPrismaClient } from '../../../src/infrastructure/persistence/prisma/prisma.client';
import { PrismaUserRepository } from '../../../src/infrastructure/persistence/prisma/prisma-user.repository';

// Usa una base de datos real. Solo corre si existe TEST_DATABASE_URL, p. ej.:
//   docker compose up -d auth-db
//   DATABASE_URL=... npx prisma migrate deploy
//   TEST_DATABASE_URL="postgresql://wayvo:wayvo@localhost:5436/auth_db?schema=public" npx vitest run
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('PrismaUserRepository (PostgreSQL real)', () => {
  const prisma = url ? createPrismaClient(url) : (null as never);
  const users = url ? new PrismaUserRepository(prisma) : (null as never);

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it('guarda un usuario y lo encuentra por id y por correo', async () => {
    const user = User.register({ id: 'u1', email: 'ana@correo.com', name: 'Ana', passwordHash: 'hash' });
    await users.save(user);

    expect((await users.findById('u1'))?.email).toBe('ana@correo.com');
    expect((await users.findByEmail('ana@correo.com'))?.id).toBe('u1');
    expect(await users.findByEmail('nadie@correo.com')).toBeNull();
  });

  it('la base de datos impide dos usuarios con el mismo correo', async () => {
    await users.save(User.register({ id: 'u1', email: 'ana@correo.com', name: 'Ana', passwordHash: 'h' }));

    await expect(
      users.save(User.register({ id: 'u2', email: 'ana@correo.com', name: 'Otra', passwordHash: 'h', role: UserRole.ADMIN })),
    ).rejects.toThrow();
  });
});
