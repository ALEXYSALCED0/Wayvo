// Puerto hacia trip-service (Dev 4). La Saga solo conoce esta interfaz;
// el cliente HTTP real será un adapter en src/adapters/gateways.

export interface TripDraft {
  userId: string;
  destination: string;
  startDate: string; // ISO 8601
  endDate: string;   // ISO 8601
}

export interface TripServiceGateway {
  createPendingTrip(trip: TripDraft, correlationId: string): Promise<{ tripId: string }>;
  confirmTrip(tripId: string, correlationId: string): Promise<void>;
  cancelTrip(tripId: string, reason: string, correlationId: string): Promise<void>;
}