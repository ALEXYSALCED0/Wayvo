import jwt from 'jsonwebtoken';
import { UserRole } from '@wayvo/contracts';
import { config } from '../src/infrastructure/config/env';

// Firma un token igual que lo haría auth-service (mismo secreto e issuer).
export function signTestToken(
  userId = 'usr-token',
  role: UserRole = UserRole.TRAVELER,
  secret: string = config.JWT_SECRET,
): string {
  return jwt.sign({ email: `${userId}@wayvo.test`, name: 'Usuario de prueba', role }, secret, {
    subject: userId,
    issuer: 'wayvo-auth-service',
    expiresIn: 3600,
  });
}

export const authHeader = (userId?: string, role?: UserRole) => `Bearer ${signTestToken(userId, role)}`;
