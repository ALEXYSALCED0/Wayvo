import { ProviderRepository } from '../../domain/repositories/provider.repository';
import { ProviderOutput, VerifyProviderInput, toProviderOutput } from '../dtos/provider.dto';
import { ProviderNotFoundError } from '../errors/application.error';
import { LoggerPort } from '../ports/logger.port';

// Revisión de un proveedor del catálogo, VERIFIED o REJECTED
// Las reglas de qué transiciones son válidas están en la entidad Provider, solo carga, aplica la decisión y guarda
export class VerifyProviderUseCase {
  constructor(
    private readonly providers: ProviderRepository,
    private readonly logger: LoggerPort,
  ) {}

  async execute(input: VerifyProviderInput): Promise<ProviderOutput> {
    const provider = await this.providers.findById(input.providerId);
    if (!provider) throw new ProviderNotFoundError(input.providerId);

    if (input.approved) {
      provider.verify();
    } else {
      provider.reject(input.reason ?? '');
    }

    await this.providers.save(provider);
    this.logger.info('Provider verification updated', {
      providerId: provider.id,
      verificationStatus: provider.verificationStatus,
    });

    return toProviderOutput(provider);
  }
}
