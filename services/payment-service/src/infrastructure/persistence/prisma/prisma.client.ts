// Cliente Prisma propio de payment-service (se genera con `npx prisma generate`).
import { Prisma, PrismaClient } from '../../../../node_modules/.prisma/payment-client';

export { Prisma, PrismaClient };

// Una sola instancia por proceso: PrismaClient maneja su propio pool de conexiones.
export function createPrismaClient(databaseUrl: string): PrismaClient {
  return new PrismaClient({ datasourceUrl: databaseUrl });
}
