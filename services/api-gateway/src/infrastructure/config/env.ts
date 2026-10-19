import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  BOOKING_SERVICE_URL: z.string().url().default('http://localhost:3001'),
  TRIP_SERVICE_URL: z.string().url().default('http://localhost:3003'),
  PROVIDER_SERVICE_URL: z.string().url().default('http://localhost:3002'),
  AI_SERVICE_URL: z.string().url().default('http://localhost:8000'),
  CORS_ORIGIN: z.string().default('*'),
  HTTP_TIMEOUT_MS: z.coerce.number().default(10000),
  ENABLE_MOCK_FALLBACK: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),
});

export type GatewayConfig = z.infer<typeof envSchema>;

export function loadConfig(rawEnv: NodeJS.ProcessEnv = process.env): GatewayConfig {
  const result = envSchema.safeParse(rawEnv);
  if (!result.success) {
    console.error('[API Gateway] Invalid environment configuration:', result.error.format());
    throw new Error('Invalid Gateway configuration');
  }
  return result.data;
}

export const config = loadConfig();
