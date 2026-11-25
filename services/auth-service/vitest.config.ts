import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Carga .env para que TEST_DATABASE_URL active los tests con base de datos real.
    setupFiles: ['dotenv/config'],
    // Los tests de base de datos comparten tablas: que no corran en paralelo entre archivos.
    fileParallelism: false,
  },
});