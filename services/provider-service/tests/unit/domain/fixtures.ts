import { Provider } from '../../../src/domain/entities/provider';
import { ServiceOffer } from '../../../src/domain/entities/service-offer';
import { ProviderType } from '../../../src/domain/value-objects/provider-type';
import { ServiceOfferType } from '../../../src/domain/value-objects/service-offer-type';

export function makeProvider(overrides: Partial<Parameters<typeof Provider.create>[0]> = {}): Provider {
  return Provider.create({
    id: 'prov-1',
    name: 'Avianca Express',
    type: ProviderType.TRANSPORT,
    contactEmail: 'ventas@avianca-demo.com',
    ...overrides,
  });
}

export function makeOffer(overrides: Partial<Parameters<typeof ServiceOffer.create>[0]> = {}): ServiceOffer {
  return ServiceOffer.create({
    id: 'offer-1',
    providerId: 'prov-1',
    type: ServiceOfferType.TRANSPORT,
    title: 'Bogotá - Cartagena',
    description: 'Vuelo directo, 1h 30m',
    unitPrice: 320000,
    currency: 'COP',
    availableCapacity: 10,
    ...overrides,
  });
}
