import { User, UserRole } from '../../../src/domain/entities/user';
import { createPrismaClient } from '../../../src/infrastructure/persistence/prisma/prisma.client';
import { PrismaAiPlanUsageRepository } from '../../../src/infrastructure/persistence/prisma/prisma-ai-plan-usage.repository';
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
    await prisma.aiPlanUsage.deleteMany();
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

  it('persiste el plan PREMIUM y las cuentas nuevas quedan FREE', async () => {
    const user = User.register({ id: 'u1', email: 'ana@correo.com', name: 'Ana', passwordHash: 'h' });
    await users.save(user);
    expect((await users.findById('u1'))?.plan).toBe('FREE');

    const end = new Date('2026-12-23T00:00:00Z');
    user.changePlan('PREMIUM' as never, 'sub_1', end);
    await users.save(user);

    const saved = await users.findById('u1');
    expect(saved?.isPremium()).toBe(true);
    expect(saved?.planSubscriptionId).toBe('sub_1');
    expect(saved?.planExpiresAt).toEqual(end);
  });

  it('el contador de planes de IA es atómico y por mes (PostgreSQL real)', async () => {
    const usage = new PrismaAiPlanUsageRepository(prisma);

    const results = await Promise.all(Array.from({ length: 12 }, () => usage.tryConsume('u1', '2026-11', 5)));
    expect(results.filter(Boolean)).toHaveLength(5);
    expect(await usage.getUsed('u1', '2026-11')).toBe(5);

    // un mes nuevo empieza en cero
    expect(await usage.getUsed('u1', '2026-12')).toBe(0);
    expect(await usage.tryConsume('u1', '2026-12', 5)).toBe(true);

    await usage.release('u1', '2026-11');
    expect(await usage.getUsed('u1', '2026-11')).toBe(4);
    await usage.release('u1', '2027-01'); // no existe: no falla ni baja de cero
    expect(await usage.getUsed('u1', '2027-01')).toBe(0);
  });
});
