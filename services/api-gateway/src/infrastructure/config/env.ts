import 'dotenv/config';
import { z } from 'zod';

// Secreto SOLO para desarrollo local; es el mismo valor por defecto que usa auth-service.
// En producción el gateway se niega a arrancar con él.
export const DEV_JWT_SECRET = 'wayvo-dev-secret-cambiar-en-produccion';

// Token compartido con auth-service para sus rutas internas. SOLO desarrollo: en producción es obligatorio.
export const DEV_INTERNAL_TOKEN = 'wayvo-dev-internal-token-cambiar-en-produccion';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  BOOKING_SERVICE_URL: z.string().url().default('http://localhost:3001'),
  TRIP_SERVICE_URL: z.string().url().default('http://localhost:3003'),
  PROVIDER_SERVICE_URL: z.string().url().default('http://localhost:3002'),
  AI_SERVICE_URL: z.string().url().default('http://localhost:8000'),
  AUTH_SERVICE_URL: z.string().url().default('http://localhost:3004'),
  PAYMENT_SERVICE_URL: z.string().url().default('http://localhost:3005'),
  // Mismo secreto con el que auth-service firma los JWT. Vacío = secreto de desarrollo.
  JWT_SECRET: z.string().optional().transform((val) => val || DEV_JWT_SECRET),
  // Vacío = token de desarrollo.
  INTERNAL_SERVICE_TOKEN: z.string().optional().transform((val) => val || DEV_INTERNAL_TOKEN),
  CORS_ORIGIN: z.string().default('*'),
  HTTP_TIMEOUT_MS: z.coerce.number().default(35000),
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
  if (result.data.NODE_ENV === 'production' && result.data.JWT_SECRET === DEV_JWT_SECRET) {
    throw new Error('JWT_SECRET es obligatorio en producción');
  }
  if (result.data.NODE_ENV === 'production' && result.data.INTERNAL_SERVICE_TOKEN === DEV_INTERNAL_TOKEN) {
    throw new Error('INTERNAL_SERVICE_TOKEN es obligatorio en producción');
  }
  return result.data;
}

export const config = loadConfig();
