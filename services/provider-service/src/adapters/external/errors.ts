// Si la API falla, se traduce a un error unico para que el resto del sistema no dependa de los errores del proveedor
export class ExternalProviderError extends Error {
  readonly code = 'EXTERNAL_PROVIDER_ERROR';

  constructor(
    readonly provider: string,
    message: string,
    cause?: unknown,
  ) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = 'ExternalProviderError';
  }
}

// A la oferta o a la solicitud le faltan datos para armar la llamada al proveedor
export class AdapterMappingError extends Error {
  readonly code = 'ADAPTER_MAPPING_ERROR';

  constructor(message: string) {
    super(message);
    this.name = 'AdapterMappingError';
  }
}

// No hay adapter registrado para ese tipo de oferta
export class AdapterNotRegisteredError extends Error {
  readonly code = 'ADAPTER_NOT_REGISTERED';

  constructor(type: string) {
    super(`No external adapter registered for offers of type ${type}`);
    this.name = 'AdapterNotRegisteredError';
  }
}
