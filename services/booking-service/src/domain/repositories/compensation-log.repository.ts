import { CompensationLog } from '../entities/compensation-log';

export interface CompensationLogRepository {
  save(log: CompensationLog): Promise<void>;
  findByCorrelationId(correlationId: string): Promise<CompensationLog | null>;
}