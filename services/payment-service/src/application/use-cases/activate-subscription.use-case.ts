import { SubscriptionStatus } from '../../domain/entities/subscription';
import { SubscriptionRepository } from '../../domain/repositories/subscription.repository';
import { SubscriptionOutput, toSubscriptionOutput } from '../dtos/subscription.dto';
import { SubscriptionNotFoundError } from '../errors/application.error';
import { AccountPlan, AccountPlanGateway } from '../ports/account-plan.gateway';
import { LoggerPort } from '../ports/logger.port';
import { CancelSubscriptionUseCase } from './cancel-subscription.use-case';
import { ConfirmSubscriptionUseCase } from './confirm-subscription.use-case';

export enum ActivationStep {
  CONFIRM_PAYMENT = 'CONFIRM_PAYMENT',
  ACTIVATE_PLAN = 'ACTIVATE_PLAN',
  COMPENSATE_SUBSCRIPTION = 'COMPENSATE_SUBSCRIPTION',
}

export type ActivationStatus = 'ACTIVATED' | 'PAYMENT_PENDING' | 'COMPENSATED' | 'COMPENSATION_FAILED';

export interface ActivationStepRecord {
  step: ActivationStep;
  outcome: 'SUCCEEDED' | 'FAILED';
  detail?: string;
}

export interface ActivateSubscriptionResult {
  status: ActivationStatus;
  plan: AccountPlan;
  subscription: SubscriptionOutput;
  failedStep: ActivationStep | null;
  reason: string | null;
  // true si, al compensar, se devolvió el pago al cliente.
  refunded: boolean;
  steps: ActivationStepRecord[];
}

export interface ActivateSubscriptionInput {
  userId: string;
  subscriptionId: string;
  correlationId?: string;
}

// SAGA "activar suscripción PREMIUM". Se ejecuta cuando el navegador ya cobró con el
// Payment Element (el cobro necesita al usuario en medio, por eso la Saga empieza aquí).
//
//   1. CONFIRM_PAYMENT  payment-service pregunta a la pasarela si el pago entró
//   2. ACTIVATE_PLAN    auth-service marca la cuenta como PREMIUM
//
// Si el paso 2 falla, el cliente ya pagó pero no tiene el plan: se COMPENSA cancelando la
// suscripción y devolviendo el pago, para no cobrar algo que no se entregó.
// Si el pago no se completó (paso 1), no se cobró nada: no hay nada que compensar y la
// suscripción queda pendiente para reintentar con el mismo formulario de pago.
export class ActivateSubscriptionUseCase {
  constructor(
    private readonly subscriptions: SubscriptionRepository,
    private readonly confirmSubscription: ConfirmSubscriptionUseCase,
    private readonly cancelSubscription: CancelSubscriptionUseCase,
    private readonly accounts: AccountPlanGateway,
    private readonly logger: LoggerPort,
  ) {}

  async execute(input: ActivateSubscriptionInput): Promise<ActivateSubscriptionResult> {
    const { userId, subscriptionId, correlationId } = input;
    const steps: ActivationStepRecord[] = [];

    // Paso 1. Si la pasarela falla aquí, el error sube (502): no se sabe si se cobró,
    // y repetir la activación es seguro porque confirmar es una consulta.
    let confirmed: SubscriptionOutput;
    try {
      confirmed = await this.confirmSubscription.execute({ userId, subscriptionId, correlationId });
    } catch (error) {
      if (!(error instanceof SubscriptionNotFoundError)) {
        this.record(steps, ActivationStep.CONFIRM_PAYMENT, 'FAILED', error);
        this.log('Subscription activation failed at CONFIRM_PAYMENT', correlationId, subscriptionId, error);
      }
      throw error;
    }
    if (confirmed.status !== SubscriptionStatus.ACTIVE) {
      this.record(steps, ActivationStep.CONFIRM_PAYMENT, 'FAILED', `payment status ${confirmed.status}`);
      return {
        status: 'PAYMENT_PENDING',
        plan: 'FREE',
        subscription: confirmed,
        failedStep: ActivationStep.CONFIRM_PAYMENT,
        reason: `El pago no está completo (estado ${confirmed.status})`,
        refunded: false,
        steps,
      };
    }
    this.record(steps, ActivationStep.CONFIRM_PAYMENT, 'SUCCEEDED');

    // Paso 2.
    const currentPeriodEnd = confirmed.currentPeriodEnd ? new Date(confirmed.currentPeriodEnd) : null;
    try {
      await this.accounts.setPlan({ userId, plan: 'PREMIUM', subscriptionId, currentPeriodEnd }, correlationId);
      this.record(steps, ActivationStep.ACTIVATE_PLAN, 'SUCCEEDED');
      this.logger.info('Subscription activated', { correlationId, subscriptionId, userId });
      return { status: 'ACTIVATED', plan: 'PREMIUM', subscription: confirmed, failedStep: null, reason: null, refunded: false, steps };
    } catch (error) {
      this.record(steps, ActivationStep.ACTIVATE_PLAN, 'FAILED', error);
      this.log('Subscription activation failed at ACTIVATE_PLAN, compensating', correlationId, subscriptionId, error);
      return this.compensate(input, steps, errorMessage(error));
    }
  }

  // Compensación: cancelar la suscripción y devolver el pago. No se toca la cuenta
  // (downgradeAccount=false): justo falló, y nunca llegó a ser PREMIUM.
  private async compensate(
    input: ActivateSubscriptionInput,
    steps: ActivationStepRecord[],
    reason: string,
  ): Promise<ActivateSubscriptionResult> {
    try {
      const canceled = await this.cancelSubscription.execute({
        userId: input.userId,
        subscriptionId: input.subscriptionId,
        refund: true,
        downgradeAccount: false,
        correlationId: input.correlationId,
      });
      this.record(steps, ActivationStep.COMPENSATE_SUBSCRIPTION, 'SUCCEEDED', canceled.refunded ? 'refunded' : 'canceled without refund');
      return {
        status: 'COMPENSATED',
        plan: 'FREE',
        subscription: canceled.subscription,
        failedStep: ActivationStep.ACTIVATE_PLAN,
        reason,
        refunded: canceled.refunded,
        steps,
      };
    } catch (error) {
      // Lo más grave: se cobró, no se activó y no se pudo devolver. Requiere atención manual.
      this.record(steps, ActivationStep.COMPENSATE_SUBSCRIPTION, 'FAILED', error);
      this.logger.error('COMPENSATION FAILED: customer charged without PREMIUM plan, manual refund required', {
        correlationId: input.correlationId,
        subscriptionId: input.subscriptionId,
        userId: input.userId,
        error: errorMessage(error),
      });
      const current = await this.subscriptions.findById(input.subscriptionId);
      return {
        status: 'COMPENSATION_FAILED',
        plan: 'FREE',
        subscription: toSubscriptionOutput(current!),
        failedStep: ActivationStep.ACTIVATE_PLAN,
        reason,
        refunded: false,
        steps,
      };
    }
  }

  private record(steps: ActivationStepRecord[], step: ActivationStep, outcome: 'SUCCEEDED' | 'FAILED', detail?: unknown): void {
    steps.push({ step, outcome, ...(detail !== undefined && { detail: errorMessage(detail) }) });
  }

  private log(message: string, correlationId: string | undefined, subscriptionId: string, error: unknown): void {
    this.logger.warn(message, { correlationId, subscriptionId, error: errorMessage(error) });
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
