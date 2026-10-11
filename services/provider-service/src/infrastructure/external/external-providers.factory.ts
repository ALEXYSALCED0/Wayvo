import { ProveedorExternoRegistry } from '../../adapters/external/proveedor-externo.registry';
import { TransporteAdapter } from '../../adapters/external/transporte.adapter';
import { AlojamientoAdapter } from '../../adapters/external/alojamiento.adapter';
import { ServiceOfferType } from '../../domain/value-objects/service-offer-type';
import { FetchFn } from './http';
import { HotelsApiClient } from './hotels-api.client';
import { SerpApiFlightsClient } from './serpapi-flights.client';
import { MockAlojamientoClient } from '../mock/mock-alojamiento.client';
import { MockTransporteClient } from '../mock/mock-transporte.client';

// Arma el registro de adapters por la conf del entorno
//   EXTERNAL_PROVIDERS_MODE=real        SerpApi + hotels-api.com
//   EXTERNAL_PROVIDERS_MODE=mock        simulador local en MOCK_API_BASE_URL
export function createExternalProviderRegistry(
  env: Record<string, string | undefined> = process.env,
  fetchFn?: FetchFn,
): ProveedorExternoRegistry {
  const timeoutMs = positiveInt(env.EXTERNAL_API_TIMEOUT_MS);
  const http = { fetch: fetchFn, timeoutMs };

  if (env.EXTERNAL_PROVIDERS_MODE === 'mock') {
    const baseUrl = env.MOCK_API_BASE_URL || `http://localhost:${env.PORT || 3002}/api/v1/mock/external`;
    return new ProveedorExternoRegistry({
      [ServiceOfferType.TRANSPORT]: new TransporteAdapter(new MockTransporteClient({ baseUrl, ...http })),
      [ServiceOfferType.ACCOMMODATION]: new AlojamientoAdapter(new MockAlojamientoClient({ baseUrl, ...http })),
    });
  }

  const serpApiKey = env.SERPAPI_API_KEY;
  const hotelsApiKey = env.HOTELS_API_KEY;
  const missing = [!serpApiKey && 'SERPAPI_API_KEY', !hotelsApiKey && 'HOTELS_API_KEY'].filter(Boolean);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables for external providers: ${missing.join(', ')}`);
  }

  return new ProveedorExternoRegistry({
    [ServiceOfferType.TRANSPORT]: new TransporteAdapter(
      new SerpApiFlightsClient({ apiKey: serpApiKey!, currency: env.SERPAPI_CURRENCY, ...http }),
    ),
    [ServiceOfferType.ACCOMMODATION]: new AlojamientoAdapter(
      new HotelsApiClient({ apiKey: hotelsApiKey!, limit: positiveInt(env.HOTELS_API_LIMIT), ...http }),
    ),
  });
}

function positiveInt(value: string | undefined): number | undefined {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}
