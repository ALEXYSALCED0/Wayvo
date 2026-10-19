import { ExternalProviderError } from './errors';

// Si falla, el error original queda en cause y sale un ExternalProviderError
export async function callExternal<T>(
  provider: string,
  operation: string,
  call: () => Promise<T>,
): Promise<T> {
  try {
    return await call();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new ExternalProviderError(provider, `${provider} API failed in ${operation}: ${detail}`, error);
  }
}
