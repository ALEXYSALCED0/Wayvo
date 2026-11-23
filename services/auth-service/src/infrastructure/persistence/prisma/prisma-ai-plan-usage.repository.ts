import { AiPlanUsageRepository } from '../../../domain/repositories/ai-plan-usage.repository';
import { PrismaClient } from './prisma.client';

// Contador en PostgreSQL. Cada mes es una fila nueva (userId + period), así que no hay
// que "reiniciar" nada: al cambiar de mes simplemente se empieza otra fila en cero.
export class PrismaAiPlanUsageRepository implements AiPlanUsageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getUsed(userId: string, period: string): Promise<number> {
    const row = await this.prisma.aiPlanUsage.findUnique({ where: { userId_period: { userId, period } } });
    return row?.used ?? 0;
  }

  async tryConsume(userId: string, period: string, limit: number): Promise<boolean> {
    // 1) Asegura que exista la fila del mes (si ya existe, no hace nada).
    await this.prisma.aiPlanUsage.createMany({ data: [{ userId, period, used: 0 }], skipDuplicates: true });
    // 2) Suma 1 solo si used < limit. Es una sola sentencia UPDATE ... WHERE used < limit:
    //    la base de datos la serializa, así que no hay carrera entre peticiones simultáneas.
    const result = await this.prisma.aiPlanUsage.updateMany({
      where: { userId, period, used: { lt: limit } },
      data: { used: { increment: 1 } },
    });
    return result.count === 1;
  }

  async release(userId: string, period: string): Promise<void> {
    await this.prisma.aiPlanUsage.updateMany({
      where: { userId, period, used: { gt: 0 } },
      data: { used: { decrement: 1 } },
    });
  }
}
