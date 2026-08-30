/**
 * TripController - Handles HTTP requests for Trips and Journey Templates
 */
import { Request, Response } from 'express';
import { TripService } from '../services/TripService';

export class TripController {
  constructor(private tripService: TripService) {}

  getAllTrips = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req.query.userId as string) || 'usr-alex-1';
      const trips = await this.tripService.getAllTrips(userId);
      res.status(200).json({ success: true, data: trips });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  getTripById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { tripId } = req.params;
      const trip = await this.tripService.getTripById(tripId);
      res.status(200).json({ success: true, data: trip });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  };

  createTrip = async (req: Request, res: Response): Promise<void> => {
    try {
      const tripData = req.body;
      const createdTrip = await this.tripService.createTrip(tripData);
      res.status(201).json({ success: true, data: createdTrip });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  getTemplates = async (req: Request, res: Response): Promise<void> => {
    try {
      const templates = await this.tripService.getTemplates();
      res.status(200).json({ success: true, data: templates });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  createTripFromTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { templateId } = req.params;
      const userId = (req.body?.userId as string) || 'usr-alex-1';
      const createdTrip = await this.tripService.createTripFromTemplate(templateId, userId);
      res.status(201).json({ success: true, data: createdTrip });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  };

  resetDemo = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.tripService.resetTrips();
      const trips = await this.tripService.getAllTrips();
      res.status(200).json({ success: true, message: 'Demo reset successfully', data: trips });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
}
