import { CompensationLogProps } from '../../domain/entities/compensation-log';
import { CompensationLogRepository } from '../../domain/repositories/compensation-log.repository';
import { CompensationLogNotFoundError } from '../errors/application.error';

// Permite consultar la traza de una Saga compensada (útil para la demo).
export class GetCompensationLogUseCase {
  constructor(private readonly logs: CompensationLogRepository) {}

  async execute(correlationId: string): Promise<CompensationLogProps> {
    const log = await this.logs.findByCorrelationId(correlationId);
    if (!log) throw new CompensationLogNotFoundError(correlationId);
    return log.toPrimitives();
  }
}