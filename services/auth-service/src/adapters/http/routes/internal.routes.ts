import { Router } from 'express';
import { InternalController } from '../controllers/internal.controller';
import { internalTokenMiddleware } from '../middlewares/internal-token.middleware';

//   PUT /api/v1/internal/users/:id/plan   { plan, subscriptionId?, currentPeriodEnd? }
// El api-gateway no tiene ninguna ruta hacia /api/v1/internal: el navegador no puede llegar aquí.
export function internalRoutes(controller: InternalController, internalToken: string): Router {
  const router = Router();
  router.use('/api/v1/internal', internalTokenMiddleware(internalToken));
  router.put('/api/v1/internal/users/:id/plan', controller.setPlan);
  return router;
}
