import { AiPlanUsageRepository } from '../../domain/repositories/ai-plan-usage.repository';

// Implementación en memoria (tests y desarrollo sin base de datos).
export class InMemoryAiPlanUsageRepository implements AiPlanUsageRepository {
  private readonly used = new Map<string, number>();

  private key(userId: string, period: string): string {
    return `${userId}|${period}`;
  }

  async getUsed(userId: string, period: string): Promise<number> {
    return this.used.get(this.key(userId, period)) ?? 0;
  }

  async tryConsume(userId: string, period: string, limit: number): Promise<boolean> {
    const current = this.used.get(this.key(userId, period)) ?? 0;
    if (current >= limit) return false;
    this.used.set(this.key(userId, period), current + 1);
    return true;
  }

  async release(userId: string, period: string): Promise<void> {
    const current = this.used.get(this.key(userId, period)) ?? 0;
    if (current > 0) this.used.set(this.key(userId, period), current - 1);
  }
}
