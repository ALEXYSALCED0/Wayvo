import { PrismaClient } from '@prisma/client';

// Una sola instancia de PrismaClient por proceso (maneja su propio pool de conexiones).
export function createPrismaClient(databaseUrl?: string): PrismaClient {
  return new PrismaClient(databaseUrl ? { datasourceUrl: databaseUrl } : undefined);
}