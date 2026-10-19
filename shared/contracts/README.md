# @wayvo/contracts

Paquete canónico de contratos de datos, esquemas de validación y DTOs comunes para la plataforma **Wayvo MVP**.

Este módulo centraliza las interfaces tipadas en **TypeScript (Zod)** y los esquemas agnósticos en **JSON Schema (Draft 2020-12)** para garantizar consistencia entre todos los microservicios, el cliente móvil/web y el motor multiagente en Python.

---

## 📁 Estructura del Módulo

```text
shared/contracts/
├── package.json
├── tsconfig.json
├── README.md
├── src/
│   ├── index.ts                      # Export principal de todos los contratos y esquemas
│   ├── common/                       # Envoltorio uniforme de API y trazabilidad
│   │   ├── api-response.dto.ts       # ApiResponse<T>, ApiErrorDetail (Requisito 8.18)
│   │   ├── correlation.dto.ts        # Header 'x-correlation-id' y contexto de trazabilidad
│   │   ├── common.schemas.ts         # Validación Zod de envelopes y headers
│   │   └── index.ts
│   ├── trips/                        # Dominio de Viajes e Itinerarios (Dev 4 - Mediator)
│   │   ├── trip.dto.ts               # Trip, TripDraft, TripStatus, CreateTripInput
│   │   ├── event.dto.ts              # Event, EventType, EventStatus, ReservationStatus
│   │   ├── itinerary.dto.ts          # Itinerary, DayPlan, TimelineItem, TimelineNodeStatus
│   │   ├── incident.dto.ts           # IssueType, ReportIncidentInput, AlternativeOption
│   │   ├── mediator.dto.ts           # Contratos de coordinación para TripMediator
│   │   ├── trip.schemas.ts           # Esquemas Zod para viajes, eventos e incidencias
│   │   └── index.ts
│   ├── bookings/                     # Dominio de Reservas y Sagas (Dev 1 - Saga Orchestrator)
│   │   ├── booking.dto.ts            # Booking, BookingItem, BookingStatus, BookingItemType
│   │   ├── saga.dto.ts               # ConfirmTripSagaInput, ConfirmTripSagaResult, SagaFinalStatus
│   │   ├── compensation.dto.ts       # CompensationLog, CompensationLogEntry, SagaStep, StepOutcome
│   │   ├── booking.schemas.ts        # Esquemas Zod para reservas y saga
│   │   └── index.ts
│   ├── profiles/                     # Dominio de Perfiles y Multiagentes IA (Dev 2 & Dev 4)
│   │   ├── profile.dto.ts            # UserProfile, UserPreferences, OnboardingProfileInput
│   │   ├── personality.dto.ts        # TravelStyle, BudgetCategory, PsychologicalAssessment
│   │   ├── ai-agent.dto.ts           # Salidas de nodos LangGraph y plan estandarizado
│   │   ├── ai-chat.dto.ts            # QuickChip, ChatMessage, AIChatRequest, AIChatResponse
│   │   ├── profile.schemas.ts        # Esquemas Zod para onboarding y agentes de IA
│   │   └── index.ts
│   ├── providers/                    # Dominio de Proveedores y Adaptadores (Dev 3 - Adapter)
│   │   ├── provider.dto.ts           # Provider, ServiceOffer, VerificationStatus, ProviderType
│   │   ├── external-adapter.dto.ts   # Target IProveedorExterno, Flight y Hotel API DTOs
│   │   ├── availability.dto.ts       # CheckAvailabilityRequest, CheckAvailabilityResponse
│   │   ├── confirmation.dto.ts       # ConfirmProviderReservationRequest, ConfirmProviderReservationResponse
│   │   ├── mock-simulator.dto.ts     # MockSimulationQuery (?mode=unavailable)
│   │   ├── provider.schemas.ts       # Esquemas Zod para proveedores y simulador
│   │   └── index.ts
│   └── gateway/                      # Fachada consolidada del API Gateway (Dev 2 - Facade)
│       ├── facade.dto.ts             # TripPlanRequest/Response, TripCheckoutRequest/Response
│       ├── facade.schemas.ts         # Esquemas Zod para endpoints de la fachada
│       └── index.ts
└── schemas/
    └── json/                         # Esquemas JSON agnósticos (JSON Schema Draft 2020-12)
        ├── common.schema.json
        ├── trips.schema.json
        ├── bookings.schema.json
        ├── profiles.schema.json
        ├── providers.schema.json
        └── gateway.schema.json
```

---

## 🧩 Mapeo por Desarrollador y Patrón de Diseño

| Desarrollador | Módulos Asignados | Patrón Asignado | Contratos Clave en `shared/contracts` |
| :--- | :--- | :--- | :--- |
| **Dev 1 (Joshua)** | `services/booking-service` + Saga | **Saga (Orquestador)** | `Booking`, `BookingItem`, `ConfirmTripSagaInput`, `ConfirmTripSagaResult`, `CompensationLog`, `SagaStep` |
| **Dev 2 (Alexy)** | `services/api-gateway` + `apps/client` | **Facade** | `ApiResponse<T>`, `TripPlanRequest`, `TripPlanResponse`, `TripCheckoutRequest`, `TripCheckoutResponse`, `OnboardingProfileInput` |
| **Dev 3 (Kesly)** | `services/provider-service` + Mocks | **Adapter** | `IProveedorExterno`, `DisponibilidadQuery/Resultado`, `ReservaDatos/ConfirmacionResultado`, `CheckAvailabilityRequest/Response`, `MockSimulationQuery` |
| **Dev 4 (Santiago)** | `services/trip-service` + `services/ai-recommendation` | **Mediator** | `Trip`, `Event`, `Itinerary`, `DayPlan`, `TripMediatorIncidentInput/Result`, `AlternativeOption`, `AIPlanRecommendationResult` |

---

## 🚀 Uso en Servicios Node.js / TypeScript

### 1. Importación directa de DTOs y tipos
```typescript
import {
  ApiResponse,
  Trip,
  ConfirmTripSagaInput,
  ConfirmTripSagaResult,
  SagaStep,
  BookingStatus,
  CheckAvailabilityRequest,
  CheckAvailabilityResponse,
} from '@wayvo/contracts';
```

### 2. Validación en Controllers / Middlewares con Zod
```typescript
import { createBookingSchema, confirmTripSagaSchema } from '@wayvo/contracts';

// Validar payload entrante en un router Express
const parsedBody = confirmTripSagaSchema.parse(req.body);
```

### 3. Middleware de Errores Estandarizado (Requisito 8.18)
```typescript
import { ApiResponse, CORRELATION_ID_HEADER } from '@wayvo/contracts';
import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const correlationId = (req.headers[CORRELATION_ID_HEADER] as string) || 'unknown';
  
  const response: ApiResponse = {
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
      details: err.details,
    },
  };
  
  res.setHeader(CORRELATION_ID_HEADER, correlationId);
  res.status(err.status || 500).json(response);
}
```

---

## 🐍 Uso en Python / FastAPI (`ai-recommendation`)

Los esquemas en `shared/contracts/schemas/json/` permiten validación estricta en Python mediante `jsonschema` o generación de modelos Pydantic:

```python
import json
from pathlib import Path
import jsonschema

# Cargar esquema canónico de perfiles
schema_path = Path(__file__).parents[2] / "shared" / "contracts" / "schemas" / "json" / "profiles.schema.json"
with open(schema_path) as f:
    schema = json.load(f)

# Validar salida del grafo LangGraph antes de responder
plan_schema = schema["definitions"]["AIPlanRecommendationResult"]
jsonschema.validate(instance=agent_output_dict, schema=plan_schema)
```

---

## 🛠️ Comandos de Compilación

Desde la raíz del monorepo:
```bash
# Compilar contratos TypeScript
npm run build:contracts

# Verificar tipos sin emitir código
npm run typecheck:contracts
```

Desde la carpeta `shared/contracts`:
```bash
npm run build
npm run typecheck
```
