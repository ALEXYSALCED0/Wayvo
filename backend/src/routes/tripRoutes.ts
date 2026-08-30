/**
 * Trip Routes
 */
import { Router } from 'express';
import { TripController } from '../controllers/TripController';

export const createTripRoutes = (tripController: TripController): Router => {
  const router = Router();

  router.get('/trips', tripController.getAllTrips);
  router.get('/trips/:tripId', tripController.getTripById);
  router.post('/trips', tripController.createTrip);
  router.get('/trip-templates', tripController.getTemplates);
  router.post('/trips/from-template/:templateId', tripController.createTripFromTemplate);
  router.post('/trips/reset-demo', tripController.resetDemo);

  return router;
};
