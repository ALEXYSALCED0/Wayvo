import {
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  InvalidTokenError,
} from '../../../src/application/errors/application.error';
import { GetCurrentUserUseCase } from '../../../src/application/use-cases/get-current-user.use-case';
import { LoginUserUseCase } from '../../../src/application/use-cases/login-user.use-case';
import { RegisterUserUseCase } from '../../../src/application/use-cases/register-user.use-case';
import { UserRole } from '../../../src/domain/entities/user';
import { InMemoryUserRepository } from '../../../src/infrastructure/persistence/in-memory-user.repository';
import { FakePasswordHasher, SequentialIdGenerator, silentLogger, testTokens } from '../helpers';

function setup(adminEmails: string[] = []) {
  const users = new InMemoryUserRepository();
  const hasher = new FakePasswordHasher();
  const tokens = testTokens();
  return {
    users,
    tokens,
    register: new RegisterUserUseCase(users, hasher, tokens, new SequentialIdGenerator(), silentLogger, new Set(adminEmails)),
    login: new LoginUserUseCase(users, hasher, tokens, silentLogger),
    me: new GetCurrentUserUseCase(users, tokens),
  };
}

const ana = { name: 'Ana', email: 'ana@correo.com', password: 'clave-segura-1' };

describe('RegisterUserUseCase', () => {
  it('crea el usuario, guarda solo el hash y devuelve una sesión con token', async () => {
    const { register, users, tokens } = setup();

    const session = await register.execute(ana);

    const saved = await users.findByEmail('ana@correo.com');
    expect(saved!.passwordHash).toBe('hashed:clave-segura-1');
    expect(session.user).toEqual(expect.objectContaining({ id: 'user-1', email: 'ana@correo.com', role: 'TRAVELER' }));
    expect(session.user).not.toHaveProperty('passwordHash');
    expect(tokens.verify(session.token)?.sub).toBe('user-1');
  });

  it('no permite dos cuentas con el mismo correo (sin importar mayúsculas)', async () => {
    const { register } = setup();
    await register.execute(ana);

    await expect(register.execute({ ...ana, email: 'ANA@correo.com' })).rejects.toThrow(EmailAlreadyRegisteredError);
  });

  it('asigna rol ADMIN a los correos configurados', async () => {
    const { register } = setup(['ana@correo.com']);

    const session = await register.execute(ana);

    expect(session.user.role).toBe(UserRole.ADMIN);
  });
});

describe('LoginUserUseCase', () => {
  it('con credenciales correctas devuelve un token del usuario', async () => {
    const { register, login, tokens } = setup();
    await register.execute(ana);

    const session = await login.execute({ email: 'Ana@Correo.com', password: ana.password });

    expect(tokens.verify(session.token)).toEqual(
      expect.objectContaining({ sub: 'user-1', email: 'ana@correo.com', role: 'TRAVELER' }),
    );
  });

  it('con contraseña incorrecta falla con el mismo error que con correo inexistente', async () => {
    const { register, login } = setup();
    await register.execute(ana);

    await expect(login.execute({ email: ana.email, password: 'otra' })).rejects.toThrow(InvalidCredentialsError);
    await expect(login.execute({ email: 'nadie@correo.com', password: 'x' })).rejects.toThrow(InvalidCredentialsError);
  });
});

describe('GetCurrentUserUseCase', () => {
  it('devuelve el usuario dueño del token', async () => {
    const { register, me } = setup();
    const session = await register.execute(ana);

    const user = await me.execute(session.token);

    expect(user.email).toBe('ana@correo.com');
  });

  it('sin token o con token inválido responde InvalidTokenError', async () => {
    const { me } = setup();

    await expect(me.execute(null)).rejects.toThrow(InvalidTokenError);
    await expect(me.execute('token.falso.123')).rejects.toThrow(InvalidTokenError);
  });
});
