import { LoggerPort } from '../../application/ports/logger.port';

// Logger a consola, una línea por evento
export class ConsoleLogger implements LoggerPort {
  constructor(private readonly service: string) {}

  info(message: string, meta?: Record<string, unknown>): void {
    console.log(this.format('INFO', message, meta));
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(this.format('WARN', message, meta));
  }

  error(message: string, meta?: Record<string, unknown>): void {
    console.error(this.format('ERROR', message, meta));
  }

  private format(level: string, message: string, meta?: Record<string, unknown>): string {
    return `[${this.service}] ${level} ${message}${meta ? ` ${JSON.stringify(meta)}` : ''}`;
  }
}
