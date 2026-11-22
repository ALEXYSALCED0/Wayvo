import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

export function authRoutes(controller: AuthController): Router {
  const router = Router();
  router.post('/api/v1/auth/register', controller.register);
  router.post('/api/v1/auth/login', controller.login);
  router.get('/api/v1/auth/me', controller.me);
  return router;
}

export function healthRoutes(): Router {
  const router = Router();
  router.get('/health', (_req, res) => {
    res.status(200).json({ success: true, data: { status: 'healthy', service: 'auth-service' } });
  });
  return router;
}
