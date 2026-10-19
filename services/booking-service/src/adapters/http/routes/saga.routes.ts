import { Router } from 'express';
import { SagaController } from '../controllers/saga.controller';

export function sagaRoutes(controller: SagaController): Router {
  const router = Router();
  router.post('/api/v1/saga/confirm-trip', controller.confirmTrip);
  router.get('/api/v1/saga/:correlationId/compensation-log', controller.compensationLog);
  return router;
}