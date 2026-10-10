import { IProveedorExterno } from '../../application/ports/proveedor-externo.port';
import { ProveedorExternoResolver } from '../../application/ports/proveedor-externo-resolver.port';
import { ServiceOfferType } from '../../domain/value-objects/service-offer-type';
import { AdapterNotRegisteredError } from './errors';

// Se decide qué adapter atiende cada tipo
export class ProveedorExternoRegistry implements ProveedorExternoResolver {
  private readonly adapters: ReadonlyMap<ServiceOfferType, IProveedorExterno>;

  constructor(adapters: Partial<Record<ServiceOfferType, IProveedorExterno>>) {
    this.adapters = new Map(
      Object.entries(adapters).filter(([, adapter]) => adapter !== undefined) as Array<
        [ServiceOfferType, IProveedorExterno]
      >,
    );
  }

  resolve(type: ServiceOfferType): IProveedorExterno {
    const adapter = this.adapters.get(type);
    if (!adapter) throw new AdapterNotRegisteredError(type);
    return adapter;
  }
}
