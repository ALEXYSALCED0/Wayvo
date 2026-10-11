
import { Request, Response } from 'express';
import { IMediator } from '../../application/mediator/IMediator';
import { TripMediatorIncidentInput } from '@wayvo/contracts';
import { sendError } from './httpError';

export class EventController {
  constructor(private readonly mediator: IMediator) {}

  reportIncident = async (req: Request, res: Response): Promise<void> => {
    try {
      const input: TripMediatorIncidentInput = {
        tripId: req.params.id,
        eventId: req.body.eventId,
        type: req.body.type,
        reason: req.body.reason,
      };

      const result = await this.mediator.reportIncident(input);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      sendError(res, error, 'INCIDENT_REPORT_FAILED');
    }
  };
}
