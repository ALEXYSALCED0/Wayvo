import { PrismaClient } from '@prisma/client';
import {
  CompensationLog,
  SagaStep,
  StepOutcome,
} from '../../../domain/entities/compensation-log';
import { CompensationLogRepository } from '../../../domain/repositories/compensation-log.repository';

export class PrismaCompensationLogRepository implements CompensationLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // Guarda el log y reemplaza sus entradas en una sola transacción local.
  async save(log: CompensationLog): Promise<void> {
    const data = log.toPrimitives();
    const entries = data.entries.map((entry, position) => ({
      position,
      step: entry.step,
      outcome: entry.outcome,
      detail: entry.detail,
      at: entry.at,
    }));

    await this.prisma.$transaction([
      this.prisma.compensationLog.upsert({
        where: { id: data.id },
        create: {
          id: data.id,
          correlationId: data.correlationId,
          tripId: data.tripId,
          bookingId: data.bookingId,
          failedStep: data.failedStep,
          reason: data.reason,
          createdAt: data.createdAt,
        },
        update: {},
      }),
      this.prisma.compensationLogEntry.deleteMany({ where: { logId: data.id } }),
      this.prisma.compensationLogEntry.createMany({
        data: entries.map((entry) => ({ ...entry, logId: data.id })),
      }),
    ]);
  }

  async findByCorrelationId(correlationId: string): Promise<CompensationLog | null> {
    const row = await this.prisma.compensationLog.findUnique({
      where: { correlationId },
      include: { entries: { orderBy: { position: 'asc' } } },
    });
    if (!row) return null;

    return CompensationLog.restore({
      id: row.id,
      correlationId: row.correlationId,
      tripId: row.tripId,
      bookingId: row.bookingId,
      failedStep: row.failedStep as SagaStep,
      reason: row.reason,
      createdAt: row.createdAt,
      entries: row.entries.map((entry) => ({
        step: entry.step as SagaStep,
        outcome: entry.outcome as StepOutcome,
        detail: entry.detail,
        at: entry.at,
      })),
    });
  }
}