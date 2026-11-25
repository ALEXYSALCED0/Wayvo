import { User, UserRole } from '../../../src/domain/entities/user';
import { InvalidUserError } from '../../../src/domain/errors/domain.error';

const base = { id: 'u1', email: 'Ana@Correo.com ', name: ' Ana ', passwordHash: 'hash' };

describe('User (entidad de dominio)', () => {
  it('normaliza el correo y el nombre, y por defecto es TRAVELER', () => {
    const user = User.register(base);

    expect(user.email).toBe('ana@correo.com');
    expect(user.name).toBe('Ana');
    expect(user.role).toBe(UserRole.TRAVELER);
    expect(user.isAdmin()).toBe(false);
  });

  it('rechaza un correo con formato inválido', () => {
    expect(() => User.register({ ...base, email: 'no-es-correo' })).toThrow(InvalidUserError);
  });

  it('rechaza un nombre demasiado corto', () => {
    expect(() => User.register({ ...base, name: 'A' })).toThrow(InvalidUserError);
  });

  it('no permite un usuario sin hash de contraseña', () => {
    expect(() => User.register({ ...base, passwordHash: '' })).toThrow(InvalidUserError);
  });

  it('restore reconstruye el usuario tal cual se guardó', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z');
    const user = User.restore({ ...base, email: 'ana@correo.com', role: UserRole.ADMIN, createdAt });

    expect(user.isAdmin()).toBe(true);
    expect(user.createdAt).toEqual(createdAt);
  });
});

describe('User: plan de la cuenta', () => {
  it('una cuenta nueva es FREE y sin suscripción', () => {
    const user = User.register(base);
    expect(user.plan).toBe('FREE');
    expect(user.isPremium()).toBe(false);
    expect(user.planSubscriptionId).toBeNull();
  });

  it('restore de una cuenta anterior (sin campos de plan) queda FREE', () => {
    const user = User.restore({ ...base, email: 'ana@correo.com', role: UserRole.TRAVELER, createdAt: new Date() });
    expect(user.plan).toBe('FREE');
  });

  it('changePlan a PREMIUM guarda la suscripción y el fin del periodo; a FREE los borra', () => {
    const user = User.register(base);
    const end = new Date('2026-12-23T00:00:00Z');

    user.changePlan('PREMIUM' as never, 'sub_1', end);
    expect(user.isPremium()).toBe(true);
    expect(user.planSubscriptionId).toBe('sub_1');
    expect(user.planExpiresAt).toEqual(end);

    user.changePlan('FREE' as never, null, null);
    expect(user.isPremium()).toBe(false);
    expect(user.planSubscriptionId).toBeNull();
    expect(user.planExpiresAt).toBeNull();
  });

  it('PREMIUM sin suscripción se rechaza', () => {
    const user = User.register(base);
    expect(() => user.changePlan('PREMIUM' as never, null, null)).toThrow(InvalidUserError);
  });
});
