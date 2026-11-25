// Los casos de uso necesitan "hashear" y "comparar" contraseñas, pero no deben
// depender de una librería concreta (bcrypt, argon2...). La implementación vive
// en infrastructure/crypto.
export interface PasswordHasher {
  hash(plainPassword: string): Promise<string>;
  compare(plainPassword: string, passwordHash: string): Promise<boolean>;
}
