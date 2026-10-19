// Cliente HTTP mínimo sobre fetch (nativo en Node 22). Agrega el correlation ID,
// un timeout y convierte respuestas no exitosas en HttpGatewayError.

export class HttpGatewayError extends Error {
  constructor(
    readonly service: string,
    readonly status: number | null,
    message: string,
  ) {
    super(`${service}: ${message}`);
    this.name = 'HttpGatewayError';
  }
}

export interface HttpClientOptions {
  service: string;
  baseUrl: string;
  timeoutMs: number;
}

export class HttpClient {
  constructor(private readonly options: HttpClientOptions) {}

  async post<T>(path: string, body: unknown, correlationId: string): Promise<T> {
    const { service, baseUrl, timeoutMs } = this.options;
    let response: Response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Correlation-Id': correlationId },
        body: JSON.stringify(body ?? {}),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new HttpGatewayError(service, null, `request to ${path} failed (${reason})`);
    }

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message = payload?.error?.message ?? payload?.message ?? response.statusText;
      throw new HttpGatewayError(service, response.status, `${path} responded ${response.status}: ${message}`);
    }
    // Acepta tanto { success, data } (formato común del proyecto) como el objeto directo.
    return (payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload) as T;
  }
}