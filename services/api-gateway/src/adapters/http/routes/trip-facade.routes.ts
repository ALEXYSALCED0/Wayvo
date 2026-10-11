import { Router } from 'express';
import { TripFacadeController } from '../controllers/trip-facade.controller';

export function createTripFacadeRouter(controller: TripFacadeController): Router {
  const router = Router();

  // Facade Endpoints: Aggregated client endpoints
  router.post('/api/v1/trips/plan', controller.planTrip);
  router.post('/api/v1/trips/checkout', controller.checkoutTrip);

  return router;
}
