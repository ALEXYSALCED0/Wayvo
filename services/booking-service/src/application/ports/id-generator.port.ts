// Los casos de uso necesitan IDs nuevos, pero no deben depender de una librería
// concreta (uuid, crypto, cuid...). La implementación vive en infrastructure/id.
export interface IdGenerator {
  generate(): string;
}