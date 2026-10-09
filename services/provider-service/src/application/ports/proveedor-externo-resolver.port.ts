import { ServiceOfferType } from '../../domain/value-objects/service-offer-type';
import { IProveedorExterno } from './proveedor-externo.port';

// Según tipo de oferta, devuelve el Adapter que entiende esa API externa
// Los casos de uso nunca nombran un adapter concreto, para agregar un nuevo proveedor se registra otro adapter
export interface ProveedorExternoResolver {
  resolve(type: ServiceOfferType): IProveedorExterno;
}
