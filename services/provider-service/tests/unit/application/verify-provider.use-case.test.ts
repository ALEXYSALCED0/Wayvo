import { beforeEach, describe, expect, it } from 'vitest';
import { ProviderNotFoundError } from '../../../src/application/errors/application.error';
import { VerifyProviderUseCase } from '../../../src/application/use-cases/verify-provider.use-case';
import { InvalidVerificationTransitionError } from '../../../src/domain/errors/domain.error';
import { InMemoryProviderRepository } from '../../../src/infrastructure/persistence/in-memory-provider.repository';
import { makeProvider } from '../domain/fixtures';
import { silentLogger } from './helpers';

describe('VerifyProviderUseCase', () => {
  let repo: InMemoryProviderRepository;
  let useCase: VerifyProviderUseCase;

  beforeEach(async () => {
    repo = new InMemoryProviderRepository();
    useCase = new VerifyProviderUseCase(repo, silentLogger);
    await repo.save(makeProvider());
  });

  it('aprueba un proveedor PENDING: pasa a VERIFIED y queda guardado', async () => {
    const output = await useCase.execute({ providerId: 'prov-1', approved: true });

    expect(output.verificationStatus).toBe('VERIFIED');
    expect((await repo.findById('prov-1'))?.canReceiveBookings()).toBe(true);
  });

  it('rechaza un proveedor guardando el motivo', async () => {
    const output = await useCase.execute({
      providerId: 'prov-1',
      approved: false,
      reason: 'Documentos incompletos',
    });

    expect(output.verificationStatus).toBe('REJECTED');
    expect(output.verificationNote).toBe('Documentos incompletos');
    expect((await repo.findById('prov-1'))?.isRejected()).toBe(true);
  });

  it('puede revocar un proveedor ya verificado', async () => {
    await useCase.execute({ providerId: 'prov-1', approved: true });

    const output = await useCase.execute({ providerId: 'prov-1', approved: false, reason: 'Quejas' });

    expect(output.verificationStatus).toBe('REJECTED');
  });

  it('es idempotente: verificar dos veces no falla', async () => {
    await useCase.execute({ providerId: 'prov-1', approved: true });

    const output = await useCase.execute({ providerId: 'prov-1', approved: true });

    expect(output.verificationStatus).toBe('VERIFIED');
  });

  it('exige un motivo para rechazar y no cambia nada si falta', async () => {
    await expect(useCase.execute({ providerId: 'prov-1', approved: false })).rejects.toThrow(
      InvalidVerificationTransitionError,
    );
    expect((await repo.findById('prov-1'))?.isPending()).toBe(true);
  });

  it('no permite verificar directamente un proveedor rechazado', async () => {
    await useCase.execute({ providerId: 'prov-1', approved: false, reason: 'Documentos incompletos' });

    await expect(useCase.execute({ providerId: 'prov-1', approved: true })).rejects.toThrow(
      InvalidVerificationTransitionError,
    );
  });

  it('falla con ProviderNotFoundError si el proveedor no existe', async () => {
    await expect(useCase.execute({ providerId: 'nope', approved: true })).rejects.toThrow(ProviderNotFoundError);
  });
});
