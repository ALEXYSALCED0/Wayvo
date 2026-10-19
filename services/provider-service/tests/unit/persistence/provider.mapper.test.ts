import { describe, expect, it } from 'vitest';
import {
  ProviderMapper,
  ProviderRow,
  ServiceOfferMapper,
  ServiceOfferRow,
} from '../../../src/infrastructure/persistence/prisma/provider.mapper';
import { ProviderType } from '../../../src/domain/value-objects/provider-type';
import { ServiceOfferType } from '../../../src/domain/value-objects/service-offer-type';
import { VerificationStatus } from '../../../src/domain/value-objects/verification-status';
import { makeOffer, makeProvider } from '../domain/fixtures';

const decimal = (n: number) => ({ toNumber: () => n });
const at = new Date('2026-10-10T10:00:00Z');

describe('ProviderMapper', () => {
  const row: ProviderRow = {
    id: 'p1', name: 'AeroCaribe', type: 'TRANSPORT', verificationStatus: 'VERIFIED', verificationNote: null,
    contactEmail: 'a@b.com', contactPhone: null, rating: decimal(4.5), websiteUrl: null, createdAt: at, updatedAt: at,
  };

  it('fila -> entidad (Decimal a número, enums del dominio)', () => {
    const provider = ProviderMapper.toDomain(row);
    expect(provider.type).toBe(ProviderType.TRANSPORT);
    expect(provider.verificationStatus).toBe(VerificationStatus.VERIFIED);
    expect(provider.rating).toBe(4.5);
    expect(provider.canReceiveBookings()).toBe(true);
  });

  it('rating nulo se mantiene nulo', () => {
    expect(ProviderMapper.toDomain({ ...row, rating: null }).rating).toBeNull();
  });

  it('entidad -> datos -> entidad conserva todo', () => {
    const provider = makeProvider({ rating: 3.5, contactPhone: '123' });
    provider.reject('Documentos vencidos');
    const data = ProviderMapper.toData(provider);
    expect(data).toMatchObject({ rating: 3.5, verificationStatus: 'REJECTED', verificationNote: 'Documentos vencidos' });
    const back = ProviderMapper.toDomain({ ...data, rating: data.rating === null ? null : decimal(data.rating) });
    expect(back.toPrimitives()).toEqual(provider.toPrimitives());
  });
});

describe('ServiceOfferMapper', () => {
  const row: ServiceOfferRow = {
    id: 'o1', providerId: 'p1', type: 'TRANSPORT', title: 'BOG-CTG', description: 'directo',
    unitPrice: decimal(320000), currency: 'COP', availableCapacity: 10, active: true,
    metadata: { originAirport: 'BOG', flightNumber: 'WY100' }, createdAt: at, updatedAt: at,
  };

  it('fila -> entidad con metadata', () => {
    const offer = ServiceOfferMapper.toDomain(row);
    expect(offer.type).toBe(ServiceOfferType.TRANSPORT);
    expect(offer.unitPrice).toBe(320000);
    expect(offer.metadata).toEqual({ originAirport: 'BOG', flightNumber: 'WY100' });
  });

  it.each([null, 'texto', 42, ['a']])('metadata JSON que no es un objeto (%j) queda vacía', (metadata) => {
    expect(ServiceOfferMapper.toDomain({ ...row, metadata }).metadata).toEqual({});
  });

  it('la entidad no comparte el objeto metadata con la fila', () => {
    const offer = ServiceOfferMapper.toDomain(row);
    expect(offer.metadata).not.toBe(row.metadata);
  });

  it('entidad -> datos -> entidad conserva todo', () => {
    const offer = makeOffer({ metadata: { hotelCode: 'HTL-CTG-1' } });
    const data = ServiceOfferMapper.toData(offer);
    const back = ServiceOfferMapper.toDomain({ ...data, unitPrice: decimal(data.unitPrice) });
    expect(back.toPrimitives()).toEqual(offer.toPrimitives());
  });
});
