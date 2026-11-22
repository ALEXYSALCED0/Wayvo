import 'dotenv/config';

// Secreto SOLO para desarrollo local. En producción el servicio se niega a arrancar con él.
export const DEV_JWT_SECRET = 'wayvo-dev-secret-cambiar-en-produccion';

export interface AppConfig {
  port: number;
  nodeEnv: string;
  databaseUrl: string | null;
  jwtSecret: string;
  jwtExpiresInSeconds: number;
  bcryptRounds: number;
  adminEmails: Set<string>;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const nodeEnv = env.NODE_ENV ?? 'development';
  const jwtSecret = env.JWT_SECRET || DEV_JWT_SECRET;

  if (nodeEnv === 'production' && jwtSecret === DEV_JWT_SECRET) {
    throw new Error('JWT_SECRET es obligatorio en producción');
  }

  return {
    port: Number(env.PORT ?? 3004),
    nodeEnv,
    databaseUrl: env.DATABASE_URL || null,
    jwtSecret,
    // 8 horas por defecto.
    jwtExpiresInSeconds: Number(env.JWT_EXPIRES_IN_SECONDS ?? 8 * 60 * 60),
    // Costo de bcrypt: más alto = más seguro pero más lento. 10 es el estándar habitual.
    bcryptRounds: Number(env.BCRYPT_ROUNDS ?? 10),
    adminEmails: new Set(
      (env.ADMIN_EMAILS ?? '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    ),
  };
}
