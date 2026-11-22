import { Request, Response } from 'express';
import { CancelBookingUseCase } from '../../../application/use-cases/cancel-booking.use-case';
import { CreateBookingUseCase } from '../../../application/use-cases/create-booking.use-case';
import { GetBookingUseCase } from '../../../application/use-cases/get-booking.use-case';
import { cancelBookingSchema, createBookingSchema } from '../validation/schemas';
import { parseBody } from '../validation/validate';
import { requestUserId } from '../identity';

// Controller = adapter de entrada: traduce HTTP -> DTO -> caso de uso -> HTTP.
// No contiene reglas de negocio. Express 5 envía al errorMiddleware cualquier
// excepción de un handler async, por eso no hay try/catch aquí.
export class BookingController {
  constructor(
    private readonly createBooking: CreateBookingUseCase,
    private readonly cancelBooking: CancelBookingUseCase,
    private readonly getBooking: GetBookingUseCase,
  ) {}

  create = async (req: Request, res: Response): Promise<void> => {
    // La reserva queda a nombre del usuario autenticado (si viene del gateway).
    const userId = requestUserId(req);
    const input = parseBody(createBookingSchema, { ...req.body, ...(userId ? { userId } : {}) });
    const booking = await this.createBooking.execute(input);
    res.status(201).json({ success: true, data: booking });
  };

  cancel = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const { reason } = parseBody(cancelBookingSchema, req.body);
    // Un usuario solo puede cancelar sus propias reservas (404 si es de otro).
    const userId = requestUserId(req);
    if (userId) await this.getBooking.execute(req.params.id, userId);
    const booking = await this.cancelBooking.execute({ bookingId: req.params.id, reason });
    res.status(200).json({ success: true, data: booking });
  };

  getById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const booking = await this.getBooking.execute(req.params.id, requestUserId(req));
    res.status(200).json({ success: true, data: booking });
  };
}