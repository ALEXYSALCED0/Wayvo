import { loginRequestSchema, registerRequestSchema } from '@wayvo/contracts';
import { NextFunction, Request, Response } from 'express';
import { GetCurrentUserUseCase } from '../../../application/use-cases/get-current-user.use-case';
import { LoginUserUseCase } from '../../../application/use-cases/login-user.use-case';
import { RegisterUserUseCase } from '../../../application/use-cases/register-user.use-case';
import { parseBody } from '../validation/validate';

// Extrae el token de "Authorization: Bearer <token>".
export function bearerToken(req: Request): string | null {
  const header = req.header('authorization');
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
}

// Adaptador HTTP: traduce peticiones/respuestas HTTP a llamadas de casos de uso.
// No contiene lógica de negocio.
export class AuthController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly loginUser: LoginUserUseCase,
    private readonly getCurrentUser: GetCurrentUserUseCase,
  ) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = parseBody(registerRequestSchema, req.body);
      const session = await this.registerUser.execute(body);
      res.status(201).json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = parseBody(loginRequestSchema, req.body);
      const session = await this.loginUser.execute(body);
      res.status(200).json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.getCurrentUser.execute(bearerToken(req));
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  };
}
