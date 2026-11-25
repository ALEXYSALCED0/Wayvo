import { HttpAccountPlanGateway } from '../adapters/account/http-account-plan.gateway';
import { StripePaymentAdapter } from '../adapters/payment/stripe.adapter';
import { AccountPlanGateway } from '../application/ports/account-plan.gateway';
import { IdGenerator } from '../application/ports/id-generator.port';
import { LoggerPort } from '../application/ports/logger.port';
import { IPaymentGateway } from '../application/ports/payment-gateway.port';
import { ActivateSubscriptionUseCase } from '../application/use-cases/activate-subscription.use-case';
import { CancelSubscriptionUseCase } from '../application/use-cases/cancel-subscription.use-case';
import { ConfirmSubscriptionUseCase } from '../application/use-cases/confirm-subscription.use-case';
import { CreateSubscriptionUseCase } from '../application/use-cases/create-subscription.use-case';
import { GetMySubscriptionUseCase } from '../application/use-cases/get-my-subscription.use-case';
import { HandleWebhookUseCase } from '../application/use-cases/handle-webhook.use-case';
import { SubscriptionRepository } from '../domain/repositories/subscription.repository';
import { AppConfig, PlanInfo } from './config/env';
import { UuidGenerator } from './id/uuid.generator';
import { ConsoleLogger } from './logger/console.logger';
import { FakeAccountPlanGateway } from './mock/fake-account-plan.gateway';
import { FakeStripeApi } from './mock/fake-stripe.api';
import { PaymentSimulationState } from './mock/simulation-state';
import { InMemorySubscriptionRepository } from './persistence/in-memory-subscription.repository';
import { createPrismaClient } from './persistence/prisma/prisma.client';
import { PrismaSubscriptionRepository } from './persistence/prisma/prisma-subscription.repository';
import { StripeHttpApi } from './stripe/stripe-http.api';

export interface Container {
  logger: LoggerPort;
  ids: IdGenerator;
  plan: PlanInfo;
  mode: AppConfig['mode'];
  persistence: 'postgres' | 'in-memory';
  // 'http' = auth-service real; 'simulated' = cuenta en memoria (solo desarrollo)
  account: 'http' | 'simulated';
  createSubscription: CreateSubscriptionUseCase;
  confirmSubscription: ConfirmSubscriptionUseCase;
  activateSubscription: ActivateSubscriptionUseCase;
  cancelSubscription: CancelSubscriptionUseCase;
  getMySubscription: GetMySubscriptionUseCase;
  handleWebhook: HandleWebhookUseCase;
  // Solo existe con PAYMENTS_MODE=mock: permite provocar fallos en una demo.
  simulation?: PaymentSimulationState;
  // Solo con cuenta simulada: permite ver qué plan quedó en la cuenta (pruebas y demo).
  simulatedAccounts?: FakeAccountPlanGateway;
  // Cierra la conexión a la base de datos (apagado ordenado).
  shutdown: () => Promise<void>;
}

export interface ContainerOverrides {
  logger?: LoggerPort;
  ids?: IdGenerator;
  gateway?: IPaymentGateway;
  accounts?: AccountPlanGateway;
  subscriptions?: SubscriptionRepository;
}

// Composition root: aquí se elige qué implementación concreta usa cada puerto.
// Con PAYMENTS_MODE=real el Adapter habla con Stripe; con mock, con el simulador.
// El Adapter y todo lo que está encima son exactamente los mismos en los dos casos.
export function buildContainer(config: AppConfig, overrides: ContainerOverrides = {}): Container {
  const logger = overrides.logger ?? new ConsoleLogger('payment-service');
  const ids = overrides.ids ?? new UuidGenerator();
  const prisma = !overrides.subscriptions && config.databaseUrl ? createPrismaClient(config.databaseUrl) : null;
  const subscriptions =
    overrides.subscriptions ?? (prisma ? new PrismaSubscriptionRepository(prisma) : new InMemorySubscriptionRepository());

  let simulation: PaymentSimulationState | undefined;
  let gateway = overrides.gateway;
  if (!gateway) {
    if (config.mode === 'real' && config.stripe) {
      gateway = new StripePaymentAdapter(new StripeHttpApi(config.stripe));
    } else {
      simulation = new PaymentSimulationState();
      gateway = new StripePaymentAdapter(new FakeStripeApi(simulation));
    }
  }

  let accounts = overrides.accounts;
  if (!accounts) {
    if (config.account) {
      accounts = new HttpAccountPlanGateway({
        baseUrl: config.account.authServiceUrl,
        internalToken: config.account.internalToken,
        timeoutMs: config.account.timeoutMs,
      });
    } else {
      simulation ??= new PaymentSimulationState();
      accounts = new FakeAccountPlanGateway(simulation);
    }
  }

  const confirmSubscription = new ConfirmSubscriptionUseCase(subscriptions, gateway, logger);
  const cancelSubscription = new CancelSubscriptionUseCase(subscriptions, gateway, accounts, logger);

  return {
    logger,
    ids,
    plan: config.plan,
    mode: config.mode,
    persistence: prisma ? 'postgres' : 'in-memory',
    account: config.account ? 'http' : 'simulated',
    createSubscription: new CreateSubscriptionUseCase(subscriptions, gateway, ids, logger),
    confirmSubscription,
    activateSubscription: new ActivateSubscriptionUseCase(subscriptions, confirmSubscription, cancelSubscription, accounts, logger),
    cancelSubscription,
    getMySubscription: new GetMySubscriptionUseCase(subscriptions),
    handleWebhook: new HandleWebhookUseCase(subscriptions, gateway, accounts, logger),
    simulation,
    simulatedAccounts: accounts instanceof FakeAccountPlanGateway ? accounts : undefined,
    shutdown: async () => {
      await prisma?.$disconnect();
    },
  };
}
