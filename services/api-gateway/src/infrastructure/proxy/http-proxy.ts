import { Request, Response, NextFunction, RequestHandler } from 'express';
import { createProxyMiddleware, fixRequestBody, Options } from 'http-proxy-middleware';
import { CORRELATION_ID_HEADER } from '@wayvo/contracts';
import { ServiceUnavailableError } from '../../domain/errors/gateway.error';
import { config } from '../config/env';

export interface ServiceProxyOptions {
  serviceName: string;
  target: string;
  pathRewrite?: Record<string, string> | ((path: string, req: any) => string | undefined);
  timeoutMs?: number;
  mockFallbackHandler?: (req: Request, res: Response, next: NextFunction) => void;
}

/**
 * Creates a reverse proxy middleware configured for Wayvo microservices.
 * Injects correlation ID, rewrites paths if required, and intercepts
 * connection failures cleanly into the centralized error format.
 */
export function createServiceProxy(options: ServiceProxyOptions): RequestHandler {
  const { serviceName, target, pathRewrite, timeoutMs = config.HTTP_TIMEOUT_MS, mockFallbackHandler } = options;

  const proxyOptions: Options = {
    target,
    changeOrigin: true,
    timeout: timeoutMs,
    proxyTimeout: timeoutMs,
    pathRewrite: pathRewrite || ((path, req) => (req as any).originalUrl || path),
    on: {
      proxyReq: (proxyReq, req, res) => {
        // 1. Inject distributed tracing correlation ID
        const correlationId = (req.headers[CORRELATION_ID_HEADER] as string) || 'unknown';
        proxyReq.setHeader(CORRELATION_ID_HEADER, correlationId);

        // 2. Fix body stream if parsed by Express json body parser
        fixRequestBody(proxyReq, req);
      },
      error: (err, req, res, targetUrl) => {
        const expressReq = req as Request;
        const expressRes = res as Response;

        console.warn(
          `[API Gateway] Connection error to ${serviceName} (${targetUrl}): ${err.message}`,
        );

        // Return homogeneous 503 Service Unavailable error
        const unavailableError = new ServiceUnavailableError(serviceName, target, err.message);
        expressRes.status(unavailableError.statusCode).json({
          success: false,
          error: {
            code: unavailableError.code,
            message: `Servicio no disponible: no fue posible conectar con ${serviceName}.`,
            details: unavailableError.details,
          },
        });
      },
    },
  };

  return createProxyMiddleware(proxyOptions);
}
