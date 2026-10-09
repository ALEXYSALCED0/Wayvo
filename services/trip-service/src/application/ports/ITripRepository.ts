import { Trip } from '../../domain/entities/Trip';

// Contrato para guardar y buscar viajes.
export interface ITripRepository {
  save(trip: Trip): Promise<void>;
  findById(id: string): Promise<Trip | null>;
}
