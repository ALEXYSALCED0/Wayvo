import { Request, Response, Router } from 'express';
import {
  PAYMENT_SIMULATION_MODES,
  PaymentSimulationMode,
  PaymentSimulationState,
} from '../../../infrastructure/mock/simulation-state';

//   GET /api/v1/mock/simulate-payment                      estado actual
//   GET /api/v1/mock/simulate-payment?mode=declined        provoca el fallo
//   GET /api/v1/mock/simulate-payment?mode=slow&delayMs=4000
// modes: normal | declined | error | slow. Solo se monta con PAYMENTS_MODE=mock fuera de producción.
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
    res.status(200).json({ success: true, data: { mode: state.mode, delayMs: state.delayMs } });
  });
  return router;
}
