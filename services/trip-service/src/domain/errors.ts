export class TripNotFoundError extends Error {
  constructor(tripId: string) {
    super(`No existe un viaje con id ${tripId}`);
    this.name = 'TripNotFoundError';
  }
}

export class EventNotFoundError extends Error {
  constructor(eventId: string) {
    super(`El viaje no tiene un evento con id ${eventId}`);
    this.name = 'EventNotFoundError';
  }
}

export class AlternativeNotFoundError extends Error {
  constructor(alternativeId: string) {
    super(`El evento no tiene una alternativa con id ${alternativeId}`);
    this.name = 'AlternativeNotFoundError';
  }
}

export class DayNotFoundError extends Error {
  constructor(dayNumber: number) {
    super(`El itinerario no tiene el día ${dayNumber}`);
    this.name = 'DayNotFoundError';
  }
}

// El viaje o el evento no están en un estado que permita la operación.
export class InvalidTripStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTripStateError';
  }
}

// Datos inválidos al crear o modificar una entidad (fechas, cantidades, etc.).
export class InvalidDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDataError';
  }
}
