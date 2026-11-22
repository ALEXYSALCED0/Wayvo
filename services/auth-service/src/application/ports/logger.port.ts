// Puerto (interfaz) que la capa de aplicación usa para loguear.
// La implementación concreta vive en infrastructure/logger.
export interface LoggerPort {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}