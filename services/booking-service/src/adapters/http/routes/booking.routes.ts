import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';

export function bookingRoutes(controller: BookingController): Router {
  const router = Router();
  router.post('/api/v1/bookings', controller.create);
  router.get('/api/v1/bookings/:id', controller.getById);
  router.post('/api/v1/bookings/:id/cancel', controller.cancel);
  return router;
}