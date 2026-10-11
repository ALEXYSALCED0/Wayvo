import { Request, Response } from 'express';
import {
  ApiResponse, Trip as TripDTO, cancelTripSchema, createTripSchema,
} from '@wayvo/contracts';
import { TripService } from '../../application/services/TripService';
import { parseUtcDate, toEventDraft, toTripDTO } from '../../application/mappers/TripMapper';
import { sendError } from './httpError';

export class TripController {
  constructor(private readonly tripService: TripService) {}

  createTrip = async (req: Request, res: Response): Promise<void> => {
    try {
      // Se valida con el esquema del contrato. El viaje siempre nace en PENDING,
      // así que el campo status del cuerpo no se usa.
      const input = createTripSchema.parse(req.body ?? {});

      const trip = await this.tripService.createTrip({
        userId: input.userId,
        destination: input.destination,
        startDate: parseUtcDate(input.startDate),
        endDate: parseUtcDate(input.endDate),
        origin: input.origin,
        title: input.title,
        travelers: input.travelers,
        description: input.description,
        imageUrl: input.imageUrl,
        events: (input.events ?? []).map(toEventDraft),
      });

      this.sendTrip(res, 201, toTripDTO(trip));
    } catch (error) {
      sendError(res, error, 'TRIP_CREATION_FAILED');
    }
  };

  getTrip = async (req: Request, res: Response): Promise<void> => {
    try {
      const trip = await this.tripService.getTrip(req.params.id);
      this.sendTrip(res, 200, toTripDTO(trip));
    } catch (error) {
      sendError(res, error, 'TRIP_QUERY_FAILED');
    }
  };

  // La llama la Saga cuando todos los pasos salieron bien.
  confirmTrip = async (req: Request, res: Response): Promise<void> => {
    try {
      const trip = await this.tripService.confirmTrip(req.params.id);
      this.sendTrip(res, 200, toTripDTO(trip));
    } catch (error) {
      sendError(res, error, 'TRIP_CONFIRMATION_FAILED');
    }
  };

  // La llama la Saga como compensación. El motivo queda en el log para la trazabilidad.
  cancelTrip = async (req: Request, res: Response): Promise<void> => {
    try {
      const { reason } = cancelTripSchema.parse(req.body ?? {});
      const trip = await this.tripService.cancelTrip(req.params.id);
      console.log(`[Trip Service] Viaje ${trip.id} cancelado. Motivo: ${reason}`);
      this.sendTrip(res, 200, toTripDTO(trip));
    } catch (error) {
      sendError(res, error, 'TRIP_CANCELLATION_FAILED');
    }
  };

  private sendTrip(res: Response, status: number, trip: TripDTO): void {
    const body: ApiResponse<TripDTO> = { success: true, data: trip };
    res.status(status).json(body);
  }
}
