import { CancelBookingUseCase } from '../../../src/application/use-cases/cancel-booking.use-case';
import { ConfirmBookingUseCase } from '../../../src/application/use-cases/confirm-booking.use-case';
import { CreateBookingUseCase } from '../../../src/application/use-cases/create-booking.use-case';
import { BookingNotFoundError } from '../../../src/application/errors/application.error';
import { InvalidBookingStatusTransitionError } from '../../../src/domain/errors/domain.error';
import { InMemoryBookingRepository } from '../../../src/infrastructure/persistence/in-memory-booking.repository';
import { createBookingInput, SequentialIdGenerator, silentLogger } from './helpers';

describe('ConfirmBookingUseCase', () => {
  let repo: InMemoryBookingRepository;
  let create: CreateBookingUseCase;
  let confirm: ConfirmBookingUseCase;

  beforeEach(() => {
    repo = new InMemoryBookingRepository();
    create = new CreateBookingUseCase(repo, new SequentialIdGenerator(), silentLogger);
    confirm = new ConfirmBookingUseCase(repo, silentLogger);
  });

  it('confirma una reserva PENDING', async () => {
    const { id } = await create.execute(createBookingInput());
    const output = await confirm.execute(id);
    expect(output.status).toBe('CONFIRMED');
  });

  it('no confirma una reserva ya cancelada', async () => {
    const { id } = await create.execute(createBookingInput());
    await new CancelBookingUseCase(repo, silentLogger).execute({ bookingId: id, reason: 'x' });

    await expect(confirm.execute(id)).rejects.toThrow(InvalidBookingStatusTransitionError);
  });

  it('falla con BookingNotFoundError si la reserva no existe', async () => {
    await expect(confirm.execute('nope')).rejects.toThrow(BookingNotFoundError);
  });
});