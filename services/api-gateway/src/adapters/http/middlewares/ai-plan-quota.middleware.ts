import { NextFunction, Request, Response } from 'express';
import { CORRELATION_ID_HEADER } from '@wayvo/contracts';
import { AiPlanQuotaPort } from '../../../application/ports/ai-plan-quota.port';
import { PlanLimitError } from '../../../domain/errors/gateway.error';
import { currentUser } from './auth.middleware';

/**
 * Cuota de planes con IA (cuentas FREE vs PREMIUM). Se aplica a todo lo que genera un plan:
 * la Facade (POST /api/v1/trips/plan) y el acceso directo (POST /api/v1/ai/plan).
 *
 * 1. Pregunta a auth-service si la cuenta puede generar este plan. FREE: máximo 5 por mes
 *    calendario y sin presupuesto "Lujo". PREMIUM: sin límites. Si no, responde 403.
 * 2. Si la generación falla (IA caída, datos inválidos, cualquier respuesta >= 400),
 *    devuelve el plan descontado: un error nuestro no le cuesta un plan al usuario.
 *
 * El usuario sale del token; lo que diga el cuerpo de la petición no cuenta.
 */
export function createAiPlanQuotaMiddleware(quota: AiPlanQuotaPort) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = currentUser(res);
      const correlationId = (req.headers[CORRELATION_ID_HEADER] as string) || 'unknown';
      const budgetCategory = typeof req.body?.budgetCategory === 'string' ? req.body.budgetCategory : undefined;

      const decision = await quota.consume(user.id, budgetCategory, correlationId);
      if (!decision.allowed) {
        throw new PlanLimitError(decision.code ?? 'AI_PLAN_LIMIT_REACHED', decision.message, decision.entitlements);
      }

      if (decision.counted) {
        res.on('finish', () => {
          if (res.statusCode < 400) return;
          quota.release(user.id, decision.entitlements.aiPlans.period, correlationId).catch((err) => {
            console.error(`[API Gateway] No se pudo devolver el plan de IA de ${user.id}: ${err instanceof Error ? err.message : err}`);
          });
        });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
