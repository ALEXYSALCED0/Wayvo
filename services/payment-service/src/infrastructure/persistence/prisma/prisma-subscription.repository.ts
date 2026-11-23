import { PlanCode, Subscription, SubscriptionStatus } from '../../../domain/entities/subscription';
import { SubscriptionRepository } from '../../../domain/repositories/subscription.repository';
import { Prisma, PrismaClient } from './prisma.client';

type SubscriptionRow = Prisma.SubscriptionGetPayload<object>;

function toDomain(row: SubscriptionRow): Subscription {
  return Subscription.restore({
    id: row.id,
    userId: row.userId,
    email: row.email,
    plan: row.plan as PlanCode,
    status: row.status as SubscriptionStatus,
    providerCustomerRef: row.providerCustomerRef,
    providerSubscriptionRef: row.providerSubscriptionRef,
    currentPeriodEnd: row.currentPeriodEnd,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    canceledAt: row.canceledAt,
  });
}

// Implementación real del puerto SubscriptionRepository sobre PostgreSQL (Payment DB).
export class PrismaSubscriptionRepository implements SubscriptionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(subscription: Subscription): Promise<void> {
    const data = {
      userId: subscription.userId,
      email: subscription.email,
      plan: subscription.plan,
      status: subscription.status,
      providerCustomerRef: subscription.providerCustomerRef,
      providerSubscriptionRef: subscription.providerSubscriptionRef,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
      canceledAt: subscription.canceledAt,
    };
    await this.prisma.subscription.upsert({
      where: { id: subscription.id },
      create: { id: subscription.id, ...data },
      update: data,
    });
  }

  async findById(id: string): Promise<Subscription | null> {
    const row = await this.prisma.subscription.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findLatestByUserId(userId: string): Promise<Subscription | null> {
    const row = await this.prisma.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return row ? toDomain(row) : null;
  }

  async findByProviderSubscriptionRef(ref: string): Promise<Subscription | null> {
    const row = await this.prisma.subscription.findUnique({ where: { providerSubscriptionRef: ref } });
    return row ? toDomain(row) : null;
  }
}
