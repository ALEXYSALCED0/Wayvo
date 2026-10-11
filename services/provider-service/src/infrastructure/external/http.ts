// Utilidad compartida por los clientes HTTP de las APIs externas.
// Los errores terminan en los logs.

export type FetchFn = typeof fetch;

export interface HttpOptions {
  fetch?: FetchFn;
  timeoutMs?: number;
}

export const DEFAULT_TIMEOUT_MS = 10_000;

export function getJson(
  url: string,
  headers: Record<string, string>,
  options: HttpOptions = {},
): Promise<unknown> {
  return requestJson(url, { method: 'GET', headers }, options);
}

export function postJson(
  url: string,
  body: unknown,
  headers: Record<string, string>,
  options: HttpOptions = {},
): Promise<unknown> {
  return requestJson(
    url,
    { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) },
    options,
  );
}

async function requestJson(
  url: string,
  init: RequestInit,
  { fetch: fetchFn = fetch, timeoutMs = DEFAULT_TIMEOUT_MS }: HttpOptions,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetchFn(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  } catch (error) {
    const reason = error instanceof Error ? error.name : 'unknown error';
    throw new Error(`request failed (${reason})`);
  }

  if (!response.ok) {
    const detail = await readErrorDetail(response);
    throw new Error(`HTTP ${response.status}${detail ? `: ${detail}` : ''}`);
  }

  try {
    return await response.json();
  } catch {
    throw new Error('invalid JSON in response');
  }
}

async function readErrorDetail(response: Response): Promise<string | undefined> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === 'object') {
      const record = body as Record<string, unknown>;
      const message = record.error ?? record.message;
      if (typeof message === 'string') return message;
    }
  } catch {
    // el cuerpo no era JSON: el código HTTP ya dice lo importante
  }
  return undefined;
}
