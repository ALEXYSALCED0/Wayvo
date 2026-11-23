import { AccountPlan } from '../../domain/entities/user';
import { UserRepository } from '../../domain/repositories/user.repository';
import { AuthUserOutput, toAuthUserOutput } from '../dtos/auth.dto';
import { AccountNotFoundError } from '../errors/application.error';
import { LoggerPort } from '../ports/logger.port';

export interface SetAccountPlanInput {
  userId: string;
  plan: AccountPlan;
  subscriptionId: string | null;
  planExpiresAt: Date | null;
  correlationId?: string;
}

// Lo invoca payment-service (ruta interna) cuando una suscripción se activa, se cancela o
// deja de pagarse. Es idempotente: repetir la misma orden deja la cuenta igual.
export class SetAccountPlanUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly logger: LoggerPort,
  ) {}

  async execute(input: SetAccountPlanInput): Promise<AuthUserOutput> {
    const user = await this.users.findById(input.userId);
    if (!user) throw new AccountNotFoundError();

    user.changePlan(input.plan, input.subscriptionId, input.planExpiresAt);
    await this.users.save(user);

    this.logger.info('Account plan changed', {
      correlationId: input.correlationId,
      userId: user.id,
      plan: user.plan,
    });
    return toAuthUserOutput(user);
  }
}
