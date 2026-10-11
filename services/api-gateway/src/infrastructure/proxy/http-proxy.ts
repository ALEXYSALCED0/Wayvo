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
    pathRewrite,
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

        // If mock fallback is enabled and available, delegate to it
        if (config.ENABLE_MOCK_FALLBACK && mockFallbackHandler) {
          console.log(`[API Gateway] Using mock fallback for ${serviceName}`);
          return mockFallbackHandler(expressReq, expressRes, (nextErr) => {
            const error = nextErr || new ServiceUnavailableError(serviceName, target, err.message);
            expressRes.status(error.statusCode || 503).json({
              success: false,
              error: {
                code: error.code || 'SERVICE_UNAVAILABLE',
                message: error.message,
                details: error.details,
              },
            });
          });
        }

        // Return homogeneous 503 error
        const unavailableError = new ServiceUnavailableError(serviceName, target, err.message);
        expressRes.status(unavailableError.statusCode).json({
          success: false,
          error: {
            code: unavailableError.code,
            message: unavailableError.message,
            details: unavailableError.details,
          },
        });
      },
    },
  };

  return createProxyMiddleware(proxyOptions);
}
