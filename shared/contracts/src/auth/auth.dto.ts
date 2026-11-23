/**
 * Contratos de autenticación y multiusuario (auth-service + API Gateway).
 *
 * Flujo:
 * 1. El cliente se registra o inicia sesión en auth-service (a través del gateway)
 *    y recibe un JWT.
 * 2. En cada petición el cliente envía `Authorization: Bearer <token>`.
 * 3. El gateway valida el token y reenvía a los servicios internos la identidad
 *    del usuario en los headers `x-user-id` y `x-user-role`.
 *    Los servicios internos confían en esos headers porque solo el gateway los escribe.
 */

export const USER_ID_HEADER = 'x-user-id';
export const USER_ROLE_HEADER = 'x-user-role';
// Correo y nombre (este último codificado con encodeURIComponent) verificados del token.
export const USER_EMAIL_HEADER = 'x-user-email';
export const USER_NAME_HEADER = 'x-user-name';

export enum UserRole {
  TRAVELER = 'TRAVELER',
  ADMIN = 'ADMIN',
}

// Plan de la cuenta: FREE (límites) o PREMIUM (suscripción mensual activa).
// Lo cambia payment-service; el cliente solo lo lee.
export enum AccountPlan {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
}

// Usuario tal como se expone hacia afuera: nunca incluye la contraseña ni su hash.
export interface AuthUserDTO {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  plan: AccountPlan;
  // Fin del periodo pagado (null en FREE).
  planExpiresAt: string | null;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Respuesta de registro y login.
export interface AuthSession {
  token: string;
  expiresAt: string;
  user: AuthUserDTO;
}

// Datos que viajan dentro del JWT (claims).
export interface AuthTokenPayload {
  sub: string; // id del usuario
  email: string;
  name: string;
  role: UserRole;
}
