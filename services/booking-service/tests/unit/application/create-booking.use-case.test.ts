import { CreateBookingUseCase } from '../../../src/application/use-cases/create-booking.use-case';
import { InvalidBookingError } from '../../../src/domain/errors/domain.error';
import { InMemoryBookingRepository } from '../../../src/infrastructure/persistence/in-memory-booking.repository';
import { createBookingInput, SequentialIdGenerator, silentLogger } from './helpers';

describe('CreateBookingUseCase', () => {
  let repo: InMemoryBookingRepository;
  let useCase: CreateBookingUseCase;

  beforeEach(() => {
    repo = new InMemoryBookingRepository();
    useCase = new CreateBookingUseCase(repo, new SequentialIdGenerator(), silentLogger);
  });

  it('crea la reserva en PENDING, con total calculado, y la persiste', async () => {
    const output = await useCase.execute(createBookingInput());

    expect(output.status).toBe('PENDING');
    expect(output.totalAmount).toBe(500000);
    expect(output.items).toHaveLength(2);

    const saved = await repo.findById(output.id);
    expect(saved?.tripId).toBe('trip-1');
  });

  it('no persiste nada si los datos violan reglas del dominio', async () => {
    await expect(useCase.execute(createBookingInput({ items: [] }))).rejects.toThrow(InvalidBookingError);
  });
});