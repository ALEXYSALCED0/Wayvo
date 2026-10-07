/**
 * Gateway Domain Errors
 * Aligned with Requirement 8.18 for homogeneous error reporting.
 */

export class GatewayError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'GatewayError';
  }
}

export class ServiceUnavailableError extends GatewayError {
  constructor(serviceName: string, targetUrl: string, originalError?: string) {
    super(
      'DOWNSTREAM_SERVICE_UNAVAILABLE',
      `Microservice '${serviceName}' is unreachable or currently under development`,
      503,
      {
        targetService: serviceName,
        targetUrl,
        originalError: originalError || 'Connection refused or timed out',
        hint: 'Verify that the target microservice is running or check Docker Compose status.',
      },
    );
  }
}

export class BadGatewayError extends GatewayError {
  constructor(serviceName: string, message: string = 'Downstream returned an invalid response') {
    super('BAD_GATEWAY', message, 502, { targetService: serviceName });
  }
}

export class GatewayTimeoutError extends GatewayError {
  constructor(serviceName: string, timeoutMs: number) {
    super(
      'GATEWAY_TIMEOUT',
      `Microservice '${serviceName}' did not respond within ${timeoutMs}ms`,
      504,
      { targetService: serviceName, timeoutMs },
    );
  }
}

export class RouteNotFoundError extends GatewayError {
  constructor(path: string, method: string) {
    super(
      'ROUTE_NOT_FOUND',
      `No route matches '${method} ${path}' in API Gateway`,
      404,
      { path, method },
    );
  }
}
