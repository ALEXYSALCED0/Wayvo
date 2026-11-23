import { PlanPolicy } from '../../domain/policies/plan-policy';
import { AiPlanUsageRepository } from '../../domain/repositories/ai-plan-usage.repository';
import { UserRepository } from '../../domain/repositories/user.repository';
import { usageWindow } from '../../domain/services/usage-window';
import { EntitlementsOutput, toEntitlementsOutput } from '../dtos/entitlements.dto';
import { AccountNotFoundError } from '../errors/application.error';
import { LoggerPort } from '../ports/logger.port';

export interface ReleaseAiPlanInput {
  userId: string;
  // Mes en el que se descontó el plan (lo devolvió consume). Así, si la generación falla
  // justo al cambiar de mes, se devuelve al mes correcto.
  period?: string;
  correlationId?: string;
}

// Devuelve un plan de IA descontado cuando la generación falló (IA caída, datos inválidos...):
// un error nuestro no debe gastarle un plan al usuario.
export class ReleaseAiPlanUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly usage: AiPlanUsageRepository,
    private readonly policy: PlanPolicy,
    private readonly timeZone: string,
    private readonly logger: LoggerPort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: ReleaseAiPlanInput): Promise<EntitlementsOutput> {
    const user = await this.users.findById(input.userId);
    if (!user) throw new AccountNotFoundError();

    const entitlements = this.policy.for(user.plan);
    const window = usageWindow(this.now(), this.timeZone);
    const period = input.period ?? window.period;

    await this.usage.release(user.id, period);
    this.logger.info('AI plan released', { correlationId: input.correlationId, userId: user.id, period });

    return toEntitlementsOutput(user, entitlements, await this.usage.getUsed(user.id, window.period), window);
  }
}
