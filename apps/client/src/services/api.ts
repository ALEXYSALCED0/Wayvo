import type {
  ApiResponse,
  TripPlanRequest,
  TripPlanResponse,
  TripCheckoutRequest,
  TripCheckoutResponse,
  Trip,
  CreateTripInput,
  ReportIncidentInput,
  TripMediatorIncidentResult,
  SelectAlternativeInput,
  TripMediatorSelectAlternativeResult,
  AIChatRequest,
  AIChatResponse,
  CompensationLogOutput,
  Provider,
  ResolveIncidentAIInput,
  ResolveIncidentAIOutput,
} from '@wayvo/contracts';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface TelemetryLogEntry {
  id: string;
  timestamp: string;
  method: string;
  endpoint: string;
  correlationId: string;
  status?: number;
  durationMs?: number;
  requestPayload?: unknown;
  responsePayload?: unknown;
  error?: string;
}

type TelemetryListener = (entry: TelemetryLogEntry) => void;
const listeners: TelemetryListener[] = [];

export function subscribeToTelemetry(listener: TelemetryListener) {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

function notifyTelemetry(entry: TelemetryLogEntry) {
  listeners.forEach((l) => l(entry));
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const correlationId = `gw-client-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const startTime = performance.now();
  const method = options.method || 'GET';

  const entry: TelemetryLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    timestamp: new Date().toLocaleTimeString(),
    method,
    endpoint,
    correlationId,
    requestPayload: options.body ? JSON.parse(options.body as string) : undefined,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        [CORRELATION_ID_HEADER]: correlationId,
        ...(options.headers || {}),
      },
    });

    const durationMs = Math.round(performance.now() - startTime);
    entry.status = response.status;
    entry.durationMs = durationMs;

    const body: ApiResponse<T> = await response.json();
    entry.responsePayload = body;
    notifyTelemetry(entry);

    if (!response.ok && !body.data) {
      const errMessage = body.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errMessage);
    }

    return (body.data !== undefined ? body.data : (body as unknown as T)) as T;
  } catch (err: any) {
    if (!entry.durationMs) {
      entry.durationMs = Math.round(performance.now() - startTime);
    }
    entry.error = err.message || 'Error de red o servicio inaccesible';
    notifyTelemetry(entry);
    throw err;
  }
}

export const WayvoApi = {
  // 1. Facade: Plan Trip via AI Multiagents (LangGraph)
  planTrip: async (payload: TripPlanRequest): Promise<TripPlanResponse> => {
    return request<TripPlanResponse>('/api/v1/trips/plan', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // 2. Facade: Checkout Trip via Saga Orchestrator
  checkoutTrip: async (payload: TripCheckoutRequest): Promise<TripCheckoutResponse> => {
    return request<TripCheckoutResponse>('/api/v1/trips/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // 3. Trip Service: Get Trip details & timeline
  getTrip: async (tripId: string): Promise<Trip> => {
    return request<Trip>(`/api/v1/trips/${tripId}`);
  },

  // 3a. Trip Service: Add events to an existing trip
  addEventsToTrip: async (tripId: string, events: any[]): Promise<Trip> => {
    return request<Trip>(`/api/v1/trips/${tripId}/events`, {
      method: 'POST',
      body: JSON.stringify({ events }),
    });
  },

  // 3b. Trip Service: List all trips for a user
  listTrips: async (userId: string = 'usr-client'): Promise<Trip[]> => {
    return request<Trip[]>(`/api/v1/trips?userId=${encodeURIComponent(userId)}`);
  },

  // 3c. Trip Service: Start a trip (transitions to ACTIVE)
  startTrip: async (tripId: string): Promise<Trip> => {
    return request<Trip>(`/api/v1/trips/${tripId}/start`, { method: 'POST' });
  },

  // 3d. Trip Service: Cancel a saved trip
  cancelTrip: async (tripId: string, reason: string = 'Cancelado por usuario'): Promise<Trip> => {
    return request<Trip>(`/api/v1/trips/${tripId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // 3d2. Trip Service: Delete trip permanently
  deleteTrip: async (tripId: string): Promise<{ deleted: boolean; tripId: string }> => {
    return request<{ deleted: boolean; tripId: string }>(`/api/v1/trips/${tripId}`, {
      method: 'DELETE',
    });
  },

  // 3d3. Trip Service: Resolve incident in itinerary (cancel original + inject new alternatives)
  resolveIncidentItinerary: async (
    tripId: string,
    payload: { eventId: string; reason: string; replacedByTitle: string; newEvents: any[] },
  ): Promise<Trip> => {
    return request<Trip>(`/api/v1/trips/${tripId}/resolve-incident`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // 3e. Trip Service: Update event reservation status (confirmed by user)
  updateEventReservation: async (
    tripId: string,
    eventId: string,
    reservationStatus: 'NOT_RESERVED' | 'CONFIRMED',
  ): Promise<Trip> => {
    return request<Trip>(`/api/v1/trips/${tripId}/events/${eventId}/reservation`, {
      method: 'PATCH',
      body: JSON.stringify({ reservationStatus }),
    });
  },

  // 3f. Trip Service: Start an event (in progress)
  startEvent: async (tripId: string, eventId: string): Promise<Trip> => {
    return request<Trip>(`/api/v1/trips/${tripId}/events/${eventId}/start`, { method: 'POST' });
  },

  // 3g. Trip Service: Complete an event
  completeEvent: async (tripId: string, eventId: string): Promise<Trip> => {
    return request<Trip>(`/api/v1/trips/${tripId}/events/${eventId}/complete`, { method: 'POST' });
  },

  // 3h. AI Service: Resolve incident dynamically with context-aware AI
  resolveIncidentAI: async (payload: ResolveIncidentAIInput): Promise<ResolveIncidentAIOutput> => {
    return request<ResolveIncidentAIOutput>('/api/v1/ai/incidents/resolve', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // 4. Trip Service: Create Trip directly (fallback/dev mode)
  createTrip: async (payload: CreateTripInput): Promise<Trip> => {
    return request<Trip>('/api/v1/trips', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // 5. Trip Service (Mediator): Report Incident
  reportIncident: async (tripId: string, input: Omit<ReportIncidentInput, 'tripId'>): Promise<TripMediatorIncidentResult> => {
    return request<TripMediatorIncidentResult>(`/api/v1/trips/${tripId}/incidents`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  // 6. Trip Service (Mediator): Select Alternative
  selectAlternative: async (
    tripId: string,
    input: Omit<SelectAlternativeInput, 'tripId'>,
  ): Promise<TripMediatorSelectAlternativeResult> => {
    return request<TripMediatorSelectAlternativeResult>(`/api/v1/trips/${tripId}/alternatives`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  // 7. AI Recommendation: Free Conversational Chat
  sendChatMessage: async (payload: AIChatRequest): Promise<AIChatResponse> => {
    return request<AIChatResponse>('/api/v1/ai/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // 8. Booking Service: Audit Compensation Log for a Saga
  getCompensationLog: async (correlationId: string): Promise<CompensationLogOutput> => {
    return request<CompensationLogOutput>(`/api/v1/saga/${correlationId}/compensation-log`);
  },

  // 9. Provider Service: Catalog of verified providers
  listProviders: async (): Promise<Provider[]> => {
    return request<Provider[]>('/api/v1/providers?includeOffers=true');
  },

  // 10. Provider Service (Mock/Chaos): Simulate failure mode (normal | unavailable | slow | error)
  simulateFailure: async (mode: 'normal' | 'unavailable' | 'slow' | 'error'): Promise<any> => {
    return request<any>(`/api/v1/mock/simulate-failure?mode=${mode}`);
  },

  // 11. Provider Service (Mock/Chaos): Reset inventory and modes
  resetSimulation: async (): Promise<any> => {
    return request<any>('/api/v1/mock/reset', { method: 'POST' });
  },

  // 12. Gateway Health Check
  getHealth: async (): Promise<any> => {
    return request<any>('/health');
  },
};
