import { User } from '../../../src/domain/entities/user';
import { PlanPolicy } from '../../../src/domain/policies/plan-policy';
import { ConsumeAiPlanUseCase } from '../../../src/application/use-cases/consume-ai-plan.use-case';
import { ReleaseAiPlanUseCase } from '../../../src/application/use-cases/release-ai-plan.use-case';
import { AccountNotFoundError } from '../../../src/application/errors/application.error';
import { InMemoryAiPlanUsageRepository } from '../../../src/infrastructure/persistence/in-memory-ai-plan-usage.repository';
import { InMemoryUserRepository } from '../../../src/infrastructure/persistence/in-memory-user.repository';
import { silentLogger } from '../helpers';

const TZ = 'America/Bogota';

async function setup(now = new Date('2026-11-23T15:00:00Z')) {
  const clock = { now };
  const users = new InMemoryUserRepository();
  const usage = new InMemoryAiPlanUsageRepository();
  const policy = new PlanPolicy(5);
  const get = () => clock.now;
  await users.save(User.register({ id: 'free', email: 'free@correo.com', name: 'Free', passwordHash: 'h' }));
  const premium = User.register({ id: 'prem', email: 'prem@correo.com', name: 'Prem', passwordHash: 'h' });
  premium.changePlan('PREMIUM' as never, 'sub_1', null);
  await users.save(premium);
  return {
    clock,
    usage,
    consume: new ConsumeAiPlanUseCase(users, usage, policy, TZ, silentLogger, get),
    release: new ReleaseAiPlanUseCase(users, usage, policy, TZ, silentLogger, get),
  };
}

describe('Límites del plan FREE y acceso PREMIUM', () => {
  it('FREE: permite 5 planes y rechaza el sexto con AI_PLAN_LIMIT_REACHED', async () => {
    const { consume } = await setup();

    for (let i = 1; i <= 5; i++) {
      const r = await consume.execute({ userId: 'free', budgetCategory: 'Estándar' });
      expect(r).toMatchObject({ allowed: true, counted: true });
      expect(r.entitlements.aiPlans).toMatchObject({ used: i, remaining: 5 - i, limit: 5 });
    }

    const sixth = await consume.execute({ userId: 'free', budgetCategory: 'Estándar' });
    expect(sixth).toMatchObject({ allowed: false, counted: false, code: 'AI_PLAN_LIMIT_REACHED' });
    expect(sixth.entitlements.aiPlans.used).toBe(5);
  });

  it('FREE: el presupuesto Lujo se rechaza (sin importar mayúsculas) y NO gasta un plan', async () => {
    const { consume } = await setup();

    for (const category of ['Lujo', 'lujo', ' LUJO ']) {
      const r = await consume.execute({ userId: 'free', budgetCategory: category });
      expect(r).toMatchObject({ allowed: false, code: 'LUXURY_BUDGET_REQUIRES_PREMIUM' });
      expect(r.entitlements.aiPlans.used).toBe(0);
    }
  });

  it('FREE: Económico, Estándar y Personalizado sí están permitidos', async () => {
    const { consume } = await setup();
    for (const category of ['Económico', 'Estándar', 'Personalizado']) {
      expect((await consume.execute({ userId: 'free', budgetCategory: category })).allowed).toBe(true);
    }
  });

  it('PREMIUM: sin límite, con Lujo, y no se cuenta nada', async () => {
    const { consume } = await setup();

    for (let i = 0; i < 8; i++) {
      const r = await consume.execute({ userId: 'prem', budgetCategory: 'Lujo' });
      expect(r).toMatchObject({ allowed: true, counted: false });
    }
    const last = await consume.execute({ userId: 'prem', budgetCategory: 'Lujo' });
    expect(last.entitlements.aiPlans).toMatchObject({ limit: null, remaining: null, used: 0 });
    expect(last.entitlements.luxuryBudget).toBe(true);
  });

  it('al empezar un mes nuevo (hora de Bogotá) el contador de FREE vuelve a cero', async () => {
    const { consume, clock } = await setup(new Date('2026-12-01T04:59:00Z')); // 30-nov 23:59 en Bogotá
    for (let i = 0; i < 5; i++) await consume.execute({ userId: 'free', budgetCategory: 'Estándar' });
    expect((await consume.execute({ userId: 'free', budgetCategory: 'Estándar' })).allowed).toBe(false);

    clock.now = new Date('2026-12-01T05:00:00Z'); // 1-dic 00:00 en Bogotá
    const first = await consume.execute({ userId: 'free', budgetCategory: 'Estándar' });
    expect(first.allowed).toBe(true);
    expect(first.entitlements.aiPlans).toMatchObject({ period: '2026-12', used: 1, remaining: 4 });
  });

  it('release devuelve el plan cuando la generación falló, y nunca baja de cero', async () => {
    const { consume, release } = await setup();
    const first = await consume.execute({ userId: 'free', budgetCategory: 'Estándar' });

    const after = await release.execute({ userId: 'free', period: first.entitlements.aiPlans.period });
    expect(after.aiPlans.used).toBe(0);

    const again = await release.execute({ userId: 'free' });
    expect(again.aiPlans.used).toBe(0);
  });

  it('una cuenta que sube a PREMIUM deja de estar limitada aunque ya hubiera gastado los 5', async () => {
    const users = new InMemoryUserRepository();
    const usage = new InMemoryAiPlanUsageRepository();
    const user = User.register({ id: 'u', email: 'u@correo.com', name: 'Uu', passwordHash: 'h' });
    await users.save(user);
    const consume = new ConsumeAiPlanUseCase(users, usage, new PlanPolicy(5), TZ, silentLogger, () => new Date('2026-11-23T15:00:00Z'));
    for (let i = 0; i < 5; i++) await consume.execute({ userId: 'u' });
    expect((await consume.execute({ userId: 'u' })).allowed).toBe(false);

    user.changePlan('PREMIUM' as never, 'sub_1', null);
    await users.save(user);
    expect((await consume.execute({ userId: 'u', budgetCategory: 'Lujo' })).allowed).toBe(true);
  });

  it('usuario inexistente → AccountNotFoundError', async () => {
    const { consume } = await setup();
    await expect(consume.execute({ userId: 'nadie' })).rejects.toThrow(AccountNotFoundError);
  });

  it('dos peticiones simultáneas no se pasan del límite', async () => {
    const { usage } = await setup();
    const results = await Promise.all(Array.from({ length: 10 }, () => usage.tryConsume('free', '2026-11', 5)));
    expect(results.filter(Boolean)).toHaveLength(5);
  });
});
