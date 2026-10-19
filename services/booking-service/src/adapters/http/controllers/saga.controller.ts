import { Request, Response } from 'express';
import { SagaOrchestrator } from '../../../application/saga/saga-orchestrator';
import { GetCompensationLogUseCase } from '../../../application/use-cases/get-compensation-log.use-case';
import { confirmTripSchema } from '../validation/schemas';
import { parseBody } from '../validation/validate';

export class SagaController {
  constructor(
    private readonly saga: SagaOrchestrator,
    private readonly getCompensationLog: GetCompensationLogUseCase,
  ) {}

  // CONFIRMED -> 201. COMPENSATED -> 409 (el viaje no se pudo confirmar, pero el
  // sistema quedó consistente). COMPENSATION_FAILED -> 500 (requiere revisión).
  confirmTrip = async (req: Request, res: Response): Promise<void> => {
    const input = parseBody(confirmTripSchema, req.body);
    const result = await this.saga.confirmTrip({ ...input, correlationId: res.locals.correlationId });

    if (result.status === 'CONFIRMED') {
      res.status(201).json({ success: true, data: result });
      return;
    }

    const compensated = result.status === 'COMPENSATED';
    res.status(compensated ? 409 : 500).json({
      success: false,
      error: {
        code: compensated ? 'SAGA_COMPENSATED' : 'SAGA_COMPENSATION_FAILED',
        message: compensated
          ? `Trip could not be confirmed and was rolled back: ${result.reason}`
          : `Trip could not be confirmed and the rollback did not complete: ${result.reason}`,
        details: result,
      },
    });
  };

  compensationLog = async (req: Request<{ correlationId: string }>, res: Response): Promise<void> => {
    const log = await this.getCompensationLog.execute(req.params.correlationId);
    res.status(200).json({ success: true, data: log });
  };
}