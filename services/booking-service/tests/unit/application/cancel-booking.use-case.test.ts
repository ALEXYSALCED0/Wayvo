import { CancelBookingUseCase } from '../../../src/application/use-cases/cancel-booking.use-case';
import { CreateBookingUseCase } from '../../../src/application/use-cases/create-booking.use-case';
import { BookingNotFoundError } from '../../../src/application/errors/application.error';
import { InMemoryBookingRepository } from '../../../src/infrastructure/persistence/in-memory-booking.repository';
import { createBookingInput, SequentialIdGenerator, silentLogger } from './helpers';

describe('CancelBookingUseCase', () => {
  let repo: InMemoryBookingRepository;
  let create: CreateBookingUseCase;
  let cancel: CancelBookingUseCase;

  beforeEach(() => {
    repo = new InMemoryBookingRepository();
    create = new CreateBookingUseCase(repo, new SequentialIdGenerator(), silentLogger);
    cancel = new CancelBookingUseCase(repo, silentLogger);
  });

  it('cancela una reserva PENDING y guarda el motivo', async () => {
    const { id } = await create.execute(createBookingInput());

    const output = await cancel.execute({ bookingId: id, reason: 'Provider unavailable' });

    expect(output.status).toBe('CANCELLED');
    expect(output.cancellationReason).toBe('Provider unavailable');
    expect((await repo.findById(id))?.isCancelled()).toBe(true);
  });

  it('es idempotente: cancelar dos veces no falla y conserva el primer motivo', async () => {
    const { id } = await create.execute(createBookingInput());
    await cancel.execute({ bookingId: id, reason: 'first' });

    const output = await cancel.execute({ bookingId: id, reason: 'retry' });

    expect(output.status).toBe('CANCELLED');
    expect(output.cancellationReason).toBe('first');
  });

  it('falla con BookingNotFoundError si la reserva no existe', async () => {
    await expect(cancel.execute({ bookingId: 'nope', reason: 'x' })).rejects.toThrow(BookingNotFoundError);
  });
});