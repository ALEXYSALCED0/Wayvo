import { PlanPolicy } from '../../domain/policies/plan-policy';
import { AiPlanUsageRepository } from '../../domain/repositories/ai-plan-usage.repository';
import { UserRepository } from '../../domain/repositories/user.repository';
import { usageWindow } from '../../domain/services/usage-window';
import { AuthUserOutput, toAuthUserOutput } from '../dtos/auth.dto';
import { EntitlementsOutput, toEntitlementsOutput } from '../dtos/entitlements.dto';
import { InvalidTokenError, UserNotFoundError } from '../errors/application.error';
import { TokenService } from '../ports/token-service.port';

export type CurrentUserOutput = AuthUserOutput & { entitlements: EntitlementsOutput };

// Caso de uso: "¿quién soy?". El cliente lo usa al recargar la app para
// comprobar que el token guardado sigue siendo válido. Además informa qué permite
// la cuenta y cuántos planes de IA lleva usados este mes (para mostrar avisos de límite).
export class GetCurrentUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly tokens: TokenService,
    private readonly usage: AiPlanUsageRepository,
    private readonly policy: PlanPolicy,
    private readonly timeZone: string,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(token: string | null): Promise<CurrentUserOutput> {
    const claims = token ? this.tokens.verify(token) : null;
    if (!claims) throw new InvalidTokenError();

    const user = await this.users.findById(claims.sub);
    if (!user) throw new UserNotFoundError();

    const window = usageWindow(this.now(), this.timeZone);
    const used = await this.usage.getUsed(user.id, window.period);
    return {
      ...toAuthUserOutput(user),
      entitlements: toEntitlementsOutput(user, this.policy.for(user.plan), used, window),
    };
  }
}
