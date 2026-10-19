
import { Request, Response } from 'express';
import { IMediator } from '../../application/mediator/IMediator';
import { reportIncidentSchema, selectAlternativeSchema } from '@wayvo/contracts';
import { sendError } from './httpError';

// El controlador no conoce a los servicios: todo lo delega en el Mediator.
export class EventController {
  constructor(private readonly mediator: IMediator) {}

  // Paso 1: el usuario reporta un problema y recibe alternativas.
  reportIncident = async (req: Request, res: Response): Promise<void> => {
    try {
      const input = reportIncidentSchema.parse({ ...req.body, tripId: req.params.id });

      const result = await this.mediator.reportIncident(input);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      sendError(res, error, 'INCIDENT_REPORT_FAILED');
    }
  };

  // Paso 2: el usuario elige una alternativa y el itinerario se actualiza.
  selectAlternative = async (req: Request, res: Response): Promise<void> => {
    try {
      const input = selectAlternativeSchema.parse({ ...req.body, tripId: req.params.id });

      const result = await this.mediator.selectAlternative(input);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      sendError(res, error, 'ALTERNATIVE_SELECTION_FAILED');
    }
  };
}
