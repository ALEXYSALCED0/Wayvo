import { Subscription, SubscriptionStatus } from '../../../src/domain/entities/subscription';
import { createPrismaClient } from '../../../src/infrastructure/persistence/prisma/prisma.client';
import { PrismaSubscriptionRepository } from '../../../src/infrastructure/persistence/prisma/prisma-subscription.repository';

// Usa una base de datos real. Solo corre si existe TEST_DATABASE_URL, p. ej.:
//   docker compose up -d payment-db
//   DATABASE_URL="postgresql://wayvo:wayvo@localhost:5437/payment_db?schema=public" npx prisma migrate deploy
//   TEST_DATABASE_URL="postgresql://wayvo:wayvo@localhost:5437/payment_db?schema=public" npx vitest run
const url = process.env.TEST_DATABASE_URL;

const state = (status: SubscriptionStatus) => ({
  status,
  currentPeriodEnd: new Date('2026-12-23T00:00:00Z'),
  cancelAtPeriodEnd: false,
});

function build(id: string, userId: string, ref: string, now: Date, status = SubscriptionStatus.INCOMPLETE) {
  return Subscription.create({
    id,
    userId,
    email: 'ana@correo.com',
    providerCustomerRef: 'cus_1',
    providerSubscriptionRef: ref,
    state: state(status),
    now,
  });
}

describe.skipIf(!url)('PrismaSubscriptionRepository (PostgreSQL real)', () => {
  const prisma = url ? createPrismaClient(url) : (null as never);
  const repo = url ? new PrismaSubscriptionRepository(prisma) : (null as never);

  beforeEach(async () => {
    await prisma.subscription.deleteMany();
  });

  afterAll(async () => {
    await prisma.subscription.deleteMany();
    await prisma.$disconnect();
  });

  it('guarda y recupera por id y por referencia de la pasarela', async () => {
    await repo.save(build('s1', 'u1', 'sub_1', new Date('2026-11-01T00:00:00Z')));

    expect((await repo.findById('s1'))?.providerSubscriptionRef).toBe('sub_1');
    expect((await repo.findByProviderSubscriptionRef('sub_1'))?.id).toBe('s1');
    expect(await repo.findByProviderSubscriptionRef('sub_x')).toBeNull();
  });

  it('save actualiza (upsert) los cambios de estado', async () => {
    const sub = build('s1', 'u1', 'sub_1', new Date('2026-11-01T00:00:00Z'));
    await repo.save(sub);

    sub.syncWith(state(SubscriptionStatus.ACTIVE));
    await repo.save(sub);

    const saved = await repo.findById('s1');
    expect(saved?.status).toBe(SubscriptionStatus.ACTIVE);
    expect(saved?.currentPeriodEnd).toEqual(new Date('2026-12-23T00:00:00Z'));
  });

  it('findLatestByUserId devuelve la más reciente del usuario', async () => {
    await repo.save(build('old', 'u1', 'sub_old', new Date('2026-10-01T00:00:00Z')));
    await repo.save(build('new', 'u1', 'sub_new', new Date('2026-11-01T00:00:00Z')));
    await repo.save(build('other', 'u2', 'sub_other', new Date('2026-11-15T00:00:00Z')));

    expect((await repo.findLatestByUserId('u1'))?.id).toBe('new');
    expect(await repo.findLatestByUserId('u3')).toBeNull();
  });

  it('la base de datos impide dos suscripciones con la misma referencia de la pasarela', async () => {
    await repo.save(build('s1', 'u1', 'sub_1', new Date()));
    await expect(repo.save(build('s2', 'u2', 'sub_1', new Date()))).rejects.toThrow();
  });
});
