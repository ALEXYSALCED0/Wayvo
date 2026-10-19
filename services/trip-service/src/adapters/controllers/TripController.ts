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

  listTrips = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req.query.userId as string) || 'usr-client';
      const trips = await this.tripService.listTripsByUser(userId);
      res.status(200).json({ success: true, data: trips.map(toTripDTO) });
    } catch (error) {
      sendError(res, error, 'TRIP_LIST_FAILED');
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

  addEvents = async (req: Request, res: Response): Promise<void> => {
    try {
      const rawEvents = req.body.events ?? (Array.isArray(req.body) ? req.body : []);
      const drafts = rawEvents.map(toEventDraft);
      const trip = await this.tripService.addEventsToTrip(req.params.id, drafts);
      this.sendTrip(res, 200, toTripDTO(trip));
    } catch (error) {
      sendError(res, error, 'ADD_EVENTS_FAILED');
    }
  };

  // Iniciar viaje (cuando llega su fecha o modo dev bypass)
  startTrip = async (req: Request, res: Response): Promise<void> => {
    try {
      const trip = await this.tripService.startTrip(req.params.id);
      this.sendTrip(res, 200, toTripDTO(trip));
    } catch (error) {
      sendError(res, error, 'TRIP_START_FAILED');
    }
  };

  // Actualizar si una reserva de evento (vuelo, hotel, etc.) fue confirmada
  updateEventReservation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { reservationStatus } = req.body;
      const trip = await this.tripService.updateEventReservation(
        req.params.id,
        req.params.eventId,
        reservationStatus,
      );
      this.sendTrip(res, 200, toTripDTO(trip));
    } catch (error) {
      sendError(res, error, 'EVENT_RESERVATION_UPDATE_FAILED');
    }
  };

  // Iniciar evento
  startEvent = async (req: Request, res: Response): Promise<void> => {
    try {
      const trip = await this.tripService.startEvent(req.params.id, req.params.eventId);
      this.sendTrip(res, 200, toTripDTO(trip));
    } catch (error) {
      sendError(res, error, 'EVENT_START_FAILED');
    }
  };

  // Completar evento
  completeEvent = async (req: Request, res: Response): Promise<void> => {
    try {
      const trip = await this.tripService.completeEvent(req.params.id, req.params.eventId);
      this.sendTrip(res, 200, toTripDTO(trip));
    } catch (error) {
      sendError(res, error, 'EVENT_COMPLETE_FAILED');
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
      const parsed = cancelTripSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Motivo de cancelación inválido' } });
        return;
      }
      const reason = parsed.data.reason || 'Cancelado por usuario';
      const trip = await this.tripService.cancelTrip(req.params.id);
      console.log(`[Trip Service] Viaje ${trip.id} cancelado. Motivo: ${reason}`);
      this.sendTrip(res, 200, toTripDTO(trip));
    } catch (error) {
      sendError(res, error, 'TRIP_CANCELLATION_FAILED');
    }
  };

  // Eliminación definitiva de un viaje
  deleteTrip = async (req: Request, res: Response): Promise<void> => {
    try {
      const deleted = await this.tripService.deleteTrip(req.params.id);
      if (!deleted) {
        res.status(404).json({ success: false, error: { code: 'TRIP_NOT_FOUND', message: 'Viaje no encontrado' } });
        return;
      }
      res.status(200).json({ success: true, data: { deleted: true, tripId: req.params.id } });
    } catch (error) {
      sendError(res, error, 'TRIP_DELETION_FAILED');
    }
  };

  // Cancelar un evento individual
  cancelEvent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { reason, replacedByTitle } = req.body ?? {};
      const trip = await this.tripService.cancelEvent(req.params.id, req.params.eventId, reason, replacedByTitle);
      this.sendTrip(res, 200, toTripDTO(trip));
    } catch (error) {
      sendError(res, error, 'EVENT_CANCEL_FAILED');
    }
  };

  // Resolver eventualidad aplicando cancelación del evento original e inyectando alternativas
  resolveIncident = async (req: Request, res: Response): Promise<void> => {
    try {
      const { eventId, reason, replacedByTitle, newEvents } = req.body ?? {};
      const drafts = (newEvents ?? []).map(toEventDraft);
      const trip = await this.tripService.resolveIncidentAlternative(
        req.params.id,
        eventId,
        reason || 'Cancelado por eventualidad',
        replacedByTitle || 'Sustituto IA',
        drafts,
      );
      this.sendTrip(res, 200, toTripDTO(trip));
    } catch (error) {
      sendError(res, error, 'RESOLVE_INCIDENT_FAILED');
    }
  };

  private sendTrip(res: Response, status: number, trip: TripDTO): void {
    const body: ApiResponse<TripDTO> = { success: true, data: trip };
    res.status(status).json(body);
  }
}
