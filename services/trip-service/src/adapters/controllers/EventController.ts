
import { Request, Response } from 'express';
import { IMediator } from '../../application/mediator/IMediator';
import { TripMediatorIncidentInput } from '@wayvo/contracts';

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
      res.status(400).json({
        success: false,
        error: {
          code: 'INCIDENT_REPORT_FAILED',
          message: error instanceof Error ? error.message : 'No se pudo reportar la incidencia',
        },
      });
    }
  };
}
