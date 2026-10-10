import { ProveedorExternoRegistry } from '../../adapters/external/proveedor-externo.registry';
import { TransporteAdapter } from '../../adapters/external/transporte.adapter';
import { AlojamientoAdapter } from '../../adapters/external/alojamiento.adapter';
import { ServiceOfferType } from '../../domain/value-objects/service-offer-type';
import { FetchFn } from './http';
import { HotelsApiClient } from './hotels-api.client';
import { SerpApiFlightsClient } from './serpapi-flights.client';

// Arma el registro de adapters con las APIs reales, leyendo la configuración del entorno
export function createExternalProviderRegistry(
  env: Record<string, string | undefined> = process.env,
  fetchFn?: FetchFn,
): ProveedorExternoRegistry {
  const serpApiKey = env.SERPAPI_API_KEY;
  const hotelsApiKey = env.HOTELS_API_KEY;
  const missing = [!serpApiKey && 'SERPAPI_API_KEY', !hotelsApiKey && 'HOTELS_API_KEY'].filter(Boolean);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables for external providers: ${missing.join(', ')}`);
  }

  const timeoutMs = positiveInt(env.EXTERNAL_API_TIMEOUT_MS);
  const http = { fetch: fetchFn, timeoutMs };

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
