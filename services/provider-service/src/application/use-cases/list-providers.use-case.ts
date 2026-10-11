import { ProviderFilter, ProviderRepository } from '../../domain/repositories/provider.repository';
import { ServiceOfferRepository } from '../../domain/repositories/service-offer.repository';
import { ServiceOfferOutput, toServiceOfferOutput } from '../dtos/offer.dto';
import { ProviderOutput, toProviderOutput } from '../dtos/provider.dto';

export interface ListProvidersInput extends ProviderFilter {
  includeOffers?: boolean;
}

export interface ProviderWithOffersOutput extends ProviderOutput {
  offers?: ServiceOfferOutput[];
}

// catálogo de proveedores con filtros por tipo y estado de verificación
export class ListProvidersUseCase {
  constructor(
    private readonly providers: ProviderRepository,
    private readonly offers: ServiceOfferRepository,
  ) {}

  async execute(input: ListProvidersInput = {}): Promise<ProviderWithOffersOutput[]> {
    const { includeOffers = false, ...filter } = input;
    const found = await this.providers.findAll(filter);

    return Promise.all(
      found.map(async (provider) => {
        const output: ProviderWithOffersOutput = toProviderOutput(provider);
        if (includeOffers) {
          output.offers = (await this.offers.findByProviderId(provider.id)).map(toServiceOfferOutput);
        }
        return output;
      }),
    );
  }
}
