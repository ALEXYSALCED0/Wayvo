import { AccountServiceError } from '../../adapters/account/errors';
import {
  AccountPlan,
  AccountPlanGateway,
  SetAccountPlanRequest,
} from '../../application/ports/account-plan.gateway';
import { PaymentSimulationState } from './simulation-state';

// Cuenta simulada: guarda el plan en memoria. Con el modo de simulación
// "activation=fail" falla a propósito, para demostrar la compensación de la Saga
// (se cobró, no se pudo activar el plan, se devuelve el pago).
export class FakeAccountPlanGateway implements AccountPlanGateway {
  readonly plans = new Map<string, AccountPlan>();
  readonly calls: SetAccountPlanRequest[] = [];

  constructor(private readonly state: PaymentSimulationState = new PaymentSimulationState()) {}

  async setPlan(request: SetAccountPlanRequest): Promise<void> {
    this.calls.push(request);
    if (this.state.activationFails) {
      throw new AccountServiceError('auth-service unavailable (simulated)', 503);
    }
    this.plans.set(request.userId, request.plan);
  }

  planOf(userId: string): AccountPlan {
    return this.plans.get(userId) ?? 'FREE';
  }
}
