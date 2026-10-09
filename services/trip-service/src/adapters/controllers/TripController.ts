import { Request, Response } from 'express';
import { TripService } from '../../application/services/TripService';

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

      res.status(201).json({
        success: true,
        data: trip,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'TRIP_CREATION_FAILED',
          message: error instanceof Error ? error.message : 'No se pudo crear el viaje',
        },
      });
    }
  };

  getTrip = async (req: Request, res: Response): Promise<void> => {
    try {
      const trip = await this.tripService.getTrip(req.params.id);

      res.status(200).json({
        success: true,
        data: trip,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: {
          code: 'TRIP_NOT_FOUND',
          message: error instanceof Error ? error.message : 'No se encontró el viaje',
        },
      });
    }
  };
}