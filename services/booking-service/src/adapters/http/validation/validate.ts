import { z } from 'zod';

export class RequestValidationError extends Error {
  readonly code = 'VALIDATION_ERROR';

  constructor(readonly details: Array<{ path: string; message: string }>) {
    super('Invalid request body');
    this.name = 'RequestValidationError';
  }
}

export function parseBody<S extends z.ZodType>(schema: S, body: unknown): z.output<S> {
  const result = schema.safeParse(body ?? {});
  if (!result.success) {
    throw new RequestValidationError(
      result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    );
  }
  return result.data;
}