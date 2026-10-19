import { Provider } from '../../../src/domain/entities/provider';
import { describe, expect, it } from 'vitest';
import {
  InvalidProviderError,
  InvalidVerificationTransitionError,
} from '../../../src/domain/errors/domain.error';
import { VerificationStatus } from '../../../src/domain/value-objects/verification-status';
import { makeProvider } from './fixtures';

describe('Provider', () => {
  it('nace en estado PENDING y no puede recibir reservas', () => {
    const provider = makeProvider();
    expect(provider.verificationStatus).toBe(VerificationStatus.PENDING);
    expect(provider.canReceiveBookings()).toBe(false);
  });

  it('verify() lo pasa a VERIFIED y lo habilita para reservas', () => {
    const provider = makeProvider();
    provider.verify();
    expect(provider.verificationStatus).toBe(VerificationStatus.VERIFIED);
    expect(provider.canReceiveBookings()).toBe(true);
  });

  it('verify() es idempotente', () => {
    const provider = makeProvider();
    provider.verify();
    expect(() => provider.verify()).not.toThrow();
    expect(provider.isVerified()).toBe(true);
  });

  it('reject() guarda el motivo y deja de recibir reservas', () => {
    const provider = makeProvider();
    provider.reject('Documentos incompletos');
    expect(provider.verificationStatus).toBe(VerificationStatus.REJECTED);
    expect(provider.verificationNote).toBe('Documentos incompletos');
    expect(provider.canReceiveBookings()).toBe(false);
  });

  it('reject() puede revocar un proveedor ya verificado', () => {
    const provider = makeProvider();
    provider.verify();
    provider.reject('Quejas reiteradas');
    expect(provider.isRejected()).toBe(true);
  });

  it('reject() exige un motivo', () => {
    expect(() => makeProvider().reject('  ')).toThrow(InvalidVerificationTransitionError);
  });

  it('un proveedor rechazado no se puede verificar directamente', () => {
    const provider = makeProvider();
    provider.reject('Documentos incompletos');
    expect(() => provider.verify()).toThrow(InvalidVerificationTransitionError);
  });

  it('exige nombre y un email de contacto válido', () => {
    expect(() => makeProvider({ name: '  ' })).toThrow(InvalidProviderError);
    expect(() => makeProvider({ contactEmail: 'no-es-un-email' })).toThrow(InvalidProviderError);
  });

  it('rechaza ratings fuera de 0-5', () => {
    expect(() => makeProvider({ rating: 5.1 })).toThrow(InvalidProviderError);
    expect(() => makeProvider({ rating: -1 })).toThrow(InvalidProviderError);
  });

  it('restore() reconstruye sin revalidar y toPrimitives() devuelve una copia', () => {
    const original = makeProvider({ rating: 4.5 });
    original.verify();
    const restored = Provider.restore(original.toPrimitives());
    expect(restored.isVerified()).toBe(true);
    expect(restored.toPrimitives()).toEqual(original.toPrimitives());
  });
});
