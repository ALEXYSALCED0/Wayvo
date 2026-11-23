-- Nuevo paso de compensación de la Saga: devolver cupos a provider-service.
ALTER TYPE "SagaStep" ADD VALUE 'COMPENSATE_PROVIDER';
