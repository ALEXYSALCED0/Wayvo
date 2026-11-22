// Cliente Prisma propio de trip-service (se genera con `npx prisma generate`).
// Ruta relativa porque en el monorepo node_modules está compartido y cada servicio
// genera su cliente en una carpeta distinta.
import { Prisma, PrismaClient } from '../../../../node_modules/.prisma/trip-client';

export { Prisma, PrismaClient };

// Una sola instancia por proceso: PrismaClient maneja su propio pool de conexiones.
export function createPrismaClient(databaseUrl: string): PrismaClient {
  return new PrismaClient({ datasourceUrl: databaseUrl });
}
