import { Request, Response, NextFunction } from 'express';
import { ApiResponse, CORRELATION_ID_HEADER } from '@wayvo/contracts';
import { GatewayError } from '../../../domain/errors/gateway.error';

/**
 * Requisito 8.18: Middleware Centralizado de Errores.
 * Interceptor de excepciones globales que captura fallas del Gateway
 * y de los microservicios downstream, devolviendo respuestas JSON homogéneas:
 * { success: false, error: { code, message, details } }
 */
export function errorMiddleware(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): void {
  const correlationId = (req.headers[CORRELATION_ID_HEADER] as string) || 'unknown';

  let statusCode = 500;
  let code = 'INTERNAL_GATEWAY_ERROR';
  let message = 'An unexpected error occurred in API Gateway';
  let details: unknown = undefined;

  if (err instanceof GatewayError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    statusCode = 503;
    code = 'SERVICE_UNAVAILABLE';
    message = 'Downstream microservice is offline or unreachable';
    details = {
      target: err.address ? `${err.address}:${err.port}` : req.originalUrl,
      syscall: err.syscall,
      hint: 'The destination microservice may still be starting or under development.',
    };
  } else if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
    statusCode = 504;
    code = 'GATEWAY_TIMEOUT';
    message = 'Downstream microservice timed out';
    details = { target: req.originalUrl };
  } else if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400) {
    statusCode = 400;
    code = 'INVALID_JSON_BODY';
    message = 'The request payload contains malformed JSON';
  } else if (err.statusCode || err.status) {
    statusCode = err.statusCode || err.status;
    code = err.code || `HTTP_${statusCode}`;
    message = err.message || 'Request failed';
    details = err.details || err.response?.data;
  } else {
    message = err.message || message;
    if (process.env.NODE_ENV !== 'production') {
      details = { stack: err.stack };
    }
  }

  // Ensure correlation ID is present in response headers
  res.setHeader(CORRELATION_ID_HEADER, correlationId);

  const responseBody: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };

  res.status(statusCode).json(responseBody);
}
