import { LoggerPort } from '../../application/ports/logger.port';

type Level = 'INFO' | 'WARN' | 'ERROR';

export class ConsoleLogger implements LoggerPort {
  constructor(private readonly service: string) {}

  info(message: string, meta: Record<string, unknown> = {}): void {
    this.write('INFO', message, meta);
  }

  warn(message: string, meta: Record<string, unknown> = {}): void {
    this.write('WARN', message, meta);
  }

  error(message: string, meta: Record<string, unknown> = {}): void {
    this.write('ERROR', message, meta);
  }

  private write(level: Level, message: string, meta: Record<string, unknown>): void {
    const line = JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      message,
      ...meta,
    });
    if (level === 'ERROR') console.error(line);
    else console.log(line);
  }
}