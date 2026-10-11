import { Request, Response, NextFunction } from 'express';
import {
  ApiResponse,
  CORRELATION_ID_HEADER,
  tripCheckoutRequestSchema,
  tripPlanRequestSchema,
} from '@wayvo/contracts';
import { TripFacade } from '../../../application/facades/trip.facade';

export class TripFacadeController {
  constructor(private readonly facade: TripFacade) {}

  /**
   * POST /api/v1/trips/plan
   * Triggers multiagent planning workflow via Facade
   */
  planTrip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsedInput = tripPlanRequestSchema.parse(req.body);
      const correlationId = (req.headers[CORRELATION_ID_HEADER] as string) || 'unknown';

      const result = await this.facade.planTrip(parsedInput, correlationId);

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Trip plan generated successfully by AI recommendation engine',
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/trips/checkout
   * Triggers distributed Saga confirmation workflow via Facade
   */
  checkoutTrip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsedInput = tripCheckoutRequestSchema.parse(req.body);
      const correlationId = (req.headers[CORRELATION_ID_HEADER] as string) || 'unknown';

      const result = await this.facade.checkoutTrip(parsedInput, correlationId);

      const sagaStatus = result.saga.status;

      if (sagaStatus === 'CONFIRMED') {
        const response: ApiResponse = {
          success: true,
          data: result,
          message: 'Trip successfully confirmed via Saga Orchestrator',
        };
        res.status(201).json(response);
        return;
      }

      const isCompensated = sagaStatus === 'COMPENSATED';
      const statusCode = isCompensated ? 409 : 500;

      const response: ApiResponse = {
        success: false,
        error: {
          code: isCompensated ? 'SAGA_COMPENSATED' : 'SAGA_COMPENSATION_FAILED',
          message: isCompensated
            ? `Trip could not be confirmed and was rolled back cleanly: ${result.saga.reason || 'Provider unavailable'}`
            : `Trip could not be confirmed and compensation encountered errors: ${result.saga.reason || 'Unknown error'}`,
          details: result.saga,
        },
      };

      res.status(statusCode).json(response);
    } catch (err) {
      next(err);
    }
  };
}
