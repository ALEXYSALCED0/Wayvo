import express, { Request, Response, Router } from 'express';
import { Container } from '../../../infrastructure/container';
import { identityMiddleware } from '../middlewares/identity.middleware';
import { cancelSubscriptionBodySchema, createSubscriptionBodySchema } from '../validation/schemas';
import { parseBody } from '../validation/validate';

const ok = <T>(data: T, message?: string) => ({ success: true, data, ...(message && { message }) });

const correlationIdOf = (res: Response): string | undefined => res.locals.correlationId;

//   GET  /plan                          plan que se vende (precio informativo)
//   POST /subscriptions                 paso 1: crea la suscripción -> { subscription, clientSecret }
//   POST /subscriptions/:id/confirm     paso 2: consulta cómo quedó el pago -> subscription
//   POST /subscriptions/:id/cancel      compensación: cancela (y con refund=true, devuelve el pago)
//   GET  /subscriptions/me              plan efectivo de la cuenta (FREE | PREMIUM)
//   POST /webhook                       eventos de Stripe (renovación, cobro fallido, cancelación)
export function paymentRoutes(container: Container): Router {
  const router = Router();

  router.get('/plan', (_req: Request, res: Response) => {
    res.status(200).json(ok(container.plan));
  });

  // El webhook va ANTES del parser JSON global y recibe el cuerpo crudo: la firma
  // se calcula sobre los bytes exactos, un JSON re-serializado ya no coincidiría.
  router.post('/webhook', express.raw({ type: '*/*', limit: '1mb' }), async (req: Request, res: Response) => {
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
    const updated = await container.handleWebhook.execute({
      rawBody,
      signature: req.header('stripe-signature') ?? req.header('x-mock-signature'),
      correlationId: correlationIdOf(res),
    });
    res.status(200).json(ok({ received: true, updated }));
  });

  const secured = Router();
  secured.use(express.json());
  secured.use(identityMiddleware);

  secured.get('/subscriptions/me', async (_req: Request, res: Response) => {
    const result = await container.getMySubscription.execute({ userId: res.locals.userId });
    res.status(200).json(ok(result));
  });

  secured.post('/subscriptions', async (req: Request, res: Response) => {
    const body = parseBody(createSubscriptionBodySchema, req.body);
    const result = await container.createSubscription.execute({
      userId: res.locals.userId,
      email: body.email,
      name: body.name,
      correlationId: correlationIdOf(res),
    });
    res.status(201).json(ok(result, 'Subscription created'));
  });

  secured.post('/subscriptions/:id/confirm', async (req: Request, res: Response) => {
    const result = await container.confirmSubscription.execute({
      userId: res.locals.userId,
      subscriptionId: String(req.params.id),
      correlationId: correlationIdOf(res),
    });
    res.status(200).json(ok(result));
  });

  secured.post('/subscriptions/:id/cancel', async (req: Request, res: Response) => {
    const body = parseBody(cancelSubscriptionBodySchema, req.body);
    const result = await container.cancelSubscription.execute({
      userId: res.locals.userId,
      subscriptionId: String(req.params.id),
      refund: body.refund,
      correlationId: correlationIdOf(res),
    });
    res.status(200).json(ok(result, 'Subscription canceled'));
  });

  router.use(secured);
  return router;
}
