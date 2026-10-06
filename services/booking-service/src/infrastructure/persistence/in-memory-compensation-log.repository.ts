import { CompensationLog } from '../../domain/entities/compensation-log';
import { CompensationLogRepository } from '../../domain/repositories/compensation-log.repository';

export class InMemoryCompensationLogRepository implements CompensationLogRepository {
  private readonly store = new Map<string, CompensationLog>();

  async save(log: CompensationLog): Promise<void> {
    this.store.set(log.correlationId, CompensationLog.restore(log.toPrimitives()));
  }

  async findByCorrelationId(correlationId: string): Promise<CompensationLog | null> {
    const found = this.store.get(correlationId);
    return found ? CompensationLog.restore(found.toPrimitives()) : null;
  }
}