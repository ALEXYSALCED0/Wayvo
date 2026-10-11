import { NextFunction, Request, RequestHandler, Response, Router } from 'express';
import { LoggerPort } from '../../application/ports/logger.port';
import { CheckAvailabilityUseCase } from '../../application/use-cases/check-availability.use-case';
import { ConfirmReservationUseCase } from '../../application/use-cases/confirm-reservation.use-case';
import { ListProvidersUseCase } from '../../application/use-cases/list-providers.use-case';
import { toHttpFailure } from './error-mapper';
import { ok, presentAvailability, presentConfirmation, presentProvider } from './presenters';
import {
  checkAvailabilityBodySchema,
  confirmReservationBodySchema,
  listProvidersQuerySchema,
  parseOrThrow,
} from './schemas';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

export interface ProvidersRouterDeps {
  listProviders: ListProvidersUseCase;
  checkAvailability: CheckAvailabilityUseCase;
  confirmReservation: ConfirmReservationUseCase;
  logger: LoggerPort;
}

//   GET  /                    catálogo (?type, ?verificationStatus, ?includeOffers=true)
//   POST /check-availability  { items } -> { available, reason?, details }
//   POST /confirm             { bookingId, items } -> { reservationCode, ... }
export function createProvidersRouter({
  listProviders,
  checkAvailability,
  confirmReservation,
  logger,
}: ProvidersRouterDeps): Router {
  const router = Router();

  // los errores de handlers async se traducen a ApiResponse.
  const handle =
    (fn: (req: Request, res: Response) => Promise<void>): RequestHandler =>
    (req: Request, res: Response, _next: NextFunction) => {
      fn(req, res).catch((error: unknown) => {
        const failure = toHttpFailure(error);
        if (failure.unexpected) {
          logger.error('Unhandled error in provider endpoint', {
            path: req.path,
            correlationId: correlationIdOf(res),
            error: error instanceof Error ? error.stack ?? error.message : String(error),
          });
        } else {
          logger.warn('Provider request failed', {
            path: req.path,
            correlationId: correlationIdOf(res),
            status: failure.status,
            code: failure.body.error?.code,
          });
        }
        res.status(failure.status).json(failure.body);
      });
    };

  router.get('/', handle(async (req, res) => {
    const query = parseOrThrow(listProvidersQuerySchema, req.query);
    const providers = await listProviders.execute({
      type: query.type,
      verificationStatus: query.verificationStatus,
      includeOffers: query.includeOffers === 'true',
    });
    res.status(200).json(ok(providers.map(presentProvider)));
  }));

  router.post('/check-availability', handle(async (req, res) => {
    const body = parseOrThrow(checkAvailabilityBodySchema, req.body);
    const result = await checkAvailability.execute({ ...body, correlationId: correlationIdOf(res) });
    res.status(200).json(ok(presentAvailability(result)));
  }));

  router.post('/confirm', handle(async (req, res) => {
    const body = parseOrThrow(confirmReservationBodySchema, req.body);
    const result = await confirmReservation.execute({ ...body, correlationId: correlationIdOf(res) });
    res.status(200).json(ok(presentConfirmation(result), 'Reservation confirmed'));
  }));

  return router;
}

function correlationIdOf(res: Response): string | undefined {
  const value = res.getHeader(CORRELATION_ID_HEADER);
  return typeof value === 'string' ? value : undefined;
}
