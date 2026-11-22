import { ServiceOffer } from '../entities/service-offer';

export interface ServiceOfferRepository {
  // Crea la oferta o actualiza sus datos. Al actualizar NO toca el cupo
  // (availableCapacity): el cupo solo cambia con tryReserve/releaseCapacity,
  // para que un guardado con datos viejos no pise lo que reservó otro usuario.
  save(offer: ServiceOffer): Promise<void>;
  findById(id: string): Promise<ServiceOffer | null>;
  // Ordenadas por título
  findByProviderId(providerId: string): Promise<ServiceOffer[]>;

  // Multiusuario / concurrencia: descuenta `quantity` cupos en UNA sola operación
  // atómica, solo si la oferta está activa y hay cupo suficiente.
  // Devuelve false si no había cupo (otro usuario lo tomó primero).
  tryReserve(offerId: string, quantity: number): Promise<boolean>;
  // Devuelve cupos (compensación) en una operación atómica.
  releaseCapacity(offerId: string, quantity: number): Promise<void>;
  // Solo administración (seed --force): fija el cupo a un valor exacto.
  resetCapacity(offerId: string, capacity: number): Promise<void>;
}
