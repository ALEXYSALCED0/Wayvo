import express, { Request, Response, Router } from 'express';
import { Container } from '../../../infrastructure/container';
import { identityMiddleware } from '../middlewares/identity.middleware';
import { cancelSubscriptionBodySchema, createSubscriptionBodySchema } from '../validation/schemas';
import { parseBody } from '../validation/validate';

const ok = <T>(data: T, message?: string) => ({ success: true, data, ...(message && { message }) });

const correlationIdOf = (res: Response): string | undefined => res.locals.correlationId;

//   GET  /plan                          plan que se vende (precio informativo)
//   POST /subscriptions                 paso 1: crea la suscripción -> { subscription, clientSecret }
//   POST /subscriptions/:id/confirm     consulta cómo quedó el pago -> subscription
//   POST /subscriptions/:id/activate    paso 2 (SAGA): confirma el pago y activa PREMIUM en la cuenta;
//                                       si la cuenta falla, cancela y devuelve el pago
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

  // La Saga de activación. Mismos códigos que la Facade del gateway para los fallos de Saga:
  //   200 ACTIVATED | 402 PAYMENT_NOT_COMPLETED (no se cobró) | 409 SAGA_COMPENSATED | 500 COMPENSATION_FAILED
  secured.post('/subscriptions/:id/activate', async (req: Request, res: Response) => {
    const result = await container.activateSubscription.execute({
      userId: res.locals.userId,
      subscriptionId: String(req.params.id),
      correlationId: correlationIdOf(res),
    });
    const details = {
      status: result.status,
      plan: result.plan,
      subscription: result.subscription,
      failedStep: result.failedStep,
      reason: result.reason,
      refunded: result.refunded,
      steps: result.steps,
    };
    if (result.status === 'ACTIVATED') {
      res.status(200).json(ok(details, 'Subscription activated'));
      return;
    }
    const failures = {
      PAYMENT_PENDING: { status: 402, code: 'PAYMENT_NOT_COMPLETED' },
      COMPENSATED: { status: 409, code: 'SAGA_COMPENSATED' },
      COMPENSATION_FAILED: { status: 500, code: 'COMPENSATION_FAILED' },
    } as const;
    const failure = failures[result.status];
    res.status(failure.status).json({
      success: false,
      error: { code: failure.code, message: result.reason ?? 'Subscription activation failed', details },
    });
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
