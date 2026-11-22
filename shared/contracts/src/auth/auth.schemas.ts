import { z } from 'zod';

export const PASSWORD_MIN_LENGTH = 8;

export const registerRequestSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(80),
  email: z.string().trim().toLowerCase().email('Correo electrónico inválido'),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`)
    .max(72, 'La contraseña no puede superar 72 caracteres'), // límite de bcrypt
});

export const loginRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email('Correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});
