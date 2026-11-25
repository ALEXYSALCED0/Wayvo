import { Request, Response, Router } from 'express';
import {
  PAYMENT_SIMULATION_MODES,
  PaymentSimulationMode,
  PaymentSimulationState,
} from '../../../infrastructure/mock/simulation-state';

//   GET /api/v1/mock/simulate-payment                      estado actual
//   GET /api/v1/mock/simulate-payment?mode=declined        provoca el fallo
//   GET /api/v1/mock/simulate-payment?mode=slow&delayMs=4000
//   GET /api/v1/mock/simulate-payment?activation=fail     la cuenta falla DESPUÉS de cobrar (provoca la compensación)
//   GET /api/v1/mock/simulate-payment?activation=ok
// modes: normal | declined | error | slow. Solo se monta con pasarela o cuenta simuladas, y nunca en producción.
export function mockRoutes(state: PaymentSimulationState): Router {
  const router = Router();
  router.get('/simulate-payment', (req: Request, res: Response) => {
    const mode = req.query.mode;
    if (mode !== undefined) {
      if (typeof mode !== 'string' || !PAYMENT_SIMULATION_MODES.includes(mode as PaymentSimulationMode)) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_MODE', message: `mode must be one of: ${PAYMENT_SIMULATION_MODES.join(', ')}`, details: null },
        });
        return;
      }
      const delay = req.query.delayMs === undefined ? undefined : Number(req.query.delayMs);
      state.set(mode as PaymentSimulationMode, Number.isFinite(delay) ? delay : undefined);
    }
    const activation = req.query.activation;
    if (activation !== undefined) {
      if (activation !== 'fail' && activation !== 'ok') {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_ACTIVATION', message: 'activation must be "fail" or "ok"', details: null },
        });
        return;
      }
      state.activationFails = activation === 'fail';
    }
    res.status(200).json({
      success: true,
      data: { mode: state.mode, delayMs: state.delayMs, activation: state.activationFails ? 'fail' : 'ok' },
    });
  });
  return router;
}
