/**
 * Event Routes
 */
import { Router } from 'express';
import { EventController } from '../controllers/EventController';

export const createEventRoutes = (eventController: EventController): Router => {
  const router = Router();

  router.get('/trips/:tripId/events', eventController.getEvents);
  router.get('/trips/:tripId/events/:eventId', eventController.getEventById);
  router.post('/trips/:tripId/events/:eventId/reserve', eventController.reserveEvent);
  router.post('/trips/:tripId/events/:eventId/complete', eventController.completeEvent);
  router.post('/trips/:tripId/events/:eventId/report-issue', eventController.reportIssue);
  router.get('/trips/:tripId/events/:eventId/alternatives', eventController.getAlternatives);
  router.post('/trips/:tripId/events/:eventId/alternatives/:alternativeId/select', eventController.selectAlternative);

  return router;
};
