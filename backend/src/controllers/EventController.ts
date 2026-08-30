/**
 * EventController - Handles HTTP requests for timeline events, lifecycle & mediator actions
 */
import { Request, Response } from 'express';
import { EventService } from '../services/EventService';
import { IMediator } from '../mediator/IMediator';
import { IssueType } from '../domain/enums/IssueType';

export class EventController {
  constructor(
    private eventService: EventService,
    private mediator: IMediator
  ) {}

  getEvents = async (req: Request, res: Response): Promise<void> => {
    try {
      const { tripId } = req.params;
      const trip = await this.eventService['repo'].getTripById(tripId);
      if (!trip) {
        res.status(404).json({ success: false, error: `Trip ${tripId} not found` });
        return;
      }
      res.status(200).json({ success: true, data: trip.events });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  getEventById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { tripId, eventId } = req.params;
      const event = await this.eventService.getEvent(tripId, eventId);
      res.status(200).json({ success: true, data: event });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  };

  reserveEvent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { tripId, eventId } = req.params;
      const updatedEvent = await this.eventService.reserveEvent(tripId, eventId);
      res.status(200).json({
        success: true,
        message: 'Reservation confirmed',
        data: updatedEvent,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  completeEvent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { tripId, eventId } = req.params;
      const updatedEvent = await this.eventService.completeEvent(tripId, eventId);
      res.status(200).json({
        success: true,
        message: 'Event marked as completed',
        data: updatedEvent,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  /**
   * Main Mediator endpoint:
   * Delegates issue coordination to the TripMediator
   */
  reportIssue = async (req: Request, res: Response): Promise<void> => {
    try {
      const { tripId, eventId } = req.params;
      const { type, reason } = req.body;

      if (!type) {
        res.status(400).json({ success: false, error: 'Issue type is required' });
        return;
      }

      const issueType = (type as IssueType) || IssueType.MISSED;

      // PASS TO MEDIATOR
      const result = await this.mediator.handleIssueReport(
        tripId,
        eventId,
        issueType,
        reason
      );

      res.status(200).json({
        success: true,
        message: 'Issue processed and alternatives generated via Mediator',
        data: {
          affectedEvent: result.affectedEvent,
          alternatives: result.alternatives,
          trip: result.updatedTrip,
        },
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  getAlternatives = async (req: Request, res: Response): Promise<void> => {
    try {
      const { tripId, eventId } = req.params;
      const event = await this.eventService.getEvent(tripId, eventId);
      res.status(200).json({
        success: true,
        data: event.alternatives || [],
      });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  };

  /**
   * Alternative Selection endpoint:
   * Delegates alternative application to the TripMediator
   */
  selectAlternative = async (req: Request, res: Response): Promise<void> => {
    try {
      const { tripId, eventId, alternativeId } = req.params;

      // PASS TO MEDIATOR
      const result = await this.mediator.handleAlternativeSelection(
        tripId,
        eventId,
        alternativeId
      );

      res.status(200).json({
        success: true,
        message: 'Alternative selected and timeline updated via Mediator',
        data: {
          selectedAlternative: result.selectedAlternative,
          trip: result.updatedTrip,
        },
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };
}
