import { Request, Response } from 'express';
import { ApiResponse, Trip as TripDTO, cancelTripSchema } from '@wayvo/contracts';
import { TripService } from '../../application/services/TripService';
import { toTripDTO } from '../../application/mappers/TripMapper';
import { sendError } from './httpError';

export class TripController {
  constructor(private readonly tripService: TripService) {}

  createTrip = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        userId,
        destination,
        startDate,
        endDate,
        origin,
        title,
        travelers,
        description,
        imageUrl,
      } = req.body;

      if (!userId || !destination || !startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TRIP_DATA',
            message: 'userId, destination, startDate y endDate son obligatorios',
          },
        });
        return;
      }

      const trip = await this.tripService.createTrip({
        userId,
        destination,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        origin,
        title,
        travelers,
        description,
        imageUrl,
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
