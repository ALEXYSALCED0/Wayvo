import jwt from 'jsonwebtoken';
import { UserRole } from '../../src/domain/entities/user';
import { BcryptPasswordHasher } from '../../src/infrastructure/crypto/bcrypt-password-hasher';
import { JwtTokenService } from '../../src/infrastructure/token/jwt-token.service';
import { TEST_SECRET } from './helpers';

const claims = { sub: 'user-1', email: 'ana@correo.com', name: 'Ana', role: UserRole.TRAVELER };

describe('JwtTokenService', () => {
  const tokens = new JwtTokenService(TEST_SECRET, 3600);

  it('un token emitido se verifica y devuelve los mismos claims', () => {
    const { token, expiresAt } = tokens.issue(claims);

    expect(tokens.verify(token)).toEqual(claims);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('rechaza un token firmado con otro secreto', () => {
    const { token } = new JwtTokenService('otro-secreto', 3600).issue(claims);

    expect(tokens.verify(token)).toBeNull();
  });

  it('rechaza un token alterado (por ejemplo, alguien se cambia el rol a ADMIN)', () => {
    const { token } = tokens.issue(claims);
    const [header, , signature] = token.split('.');
    const forgedPayload = Buffer.from(JSON.stringify({ ...claims, role: 'ADMIN' })).toString('base64url');

    expect(tokens.verify(`${header}.${forgedPayload}.${signature}`)).toBeNull();
  });

  it('rechaza un token expirado', () => {
    const expired = jwt.sign({ email: claims.email }, TEST_SECRET, {
      subject: 'user-1', issuer: 'wayvo-auth-service', expiresIn: -10,
    });

    expect(tokens.verify(expired)).toBeNull();
  });
});

describe('BcryptPasswordHasher', () => {
  const hasher = new BcryptPasswordHasher(4); // pocas rondas: tests rápidos

  it('el hash no contiene la contraseña y se puede comparar', async () => {
    const hash = await hasher.hash('clave-segura-1');

    expect(hash).not.toContain('clave-segura-1');
    expect(await hasher.compare('clave-segura-1', hash)).toBe(true);
    expect(await hasher.compare('otra-clave', hash)).toBe(false);
  });

  it('la misma contraseña produce hashes distintos (sal aleatoria)', async () => {
    expect(await hasher.hash('igual')).not.toBe(await hasher.hash('igual'));
  });
});
