# C4 Model - Nivel 3: Diagrama de Componentes y Clean Architecture

## 1. Vision General de Clean Architecture en Wayvo

Cada microservicio en Wayvo (`booking-service`, `provider-service`, `trip-service`) esta estructurado siguiendo los principios estrictos de **Clean Architecture** (Arquitectura Limpia) y el principio de inversion de dependencias:

```text
       ┌─────────────────────────────────────────────────────────┐
       │                   INFRASTRUCTURE                        │
       │     (TypeORM, Express Server, Logging, HTTP Clients)    │
       │   ┌─────────────────────────────────────────────────┐   │
       │   │                    ADAPTERS                     │   │
       │   │    (Controllers, Routes, Gateways, Adapters)    │   │
       │   │   ┌─────────────────────────────────────────┐   │   │
       │   │   │               APPLICATION               │   │   │
       │   │   │ (Use Cases, Ports, Orchestrators/Mediators)│   │
       │   │   │   ┌─────────────────────────────────┐   │   │   │
       │   │   │   │             DOMAIN              │   │   │   │
       │   │   │   │ (Entities, Value Objects, Enums)│   │   │   │
       │   │   │   └─────────────────────────────────┘   │   │   │
       │   │   └─────────────────────────────────────────┘   │   │
       │   └─────────────────────────────────────────────────┘   │
       └─────────────────────────────────────────────────────────┘
```

**Regla de Dependencia:** Las dependencias del codigo apuntan estrictamente hacia adentro. La capa de Dominio no conoce a la de Aplicacion, la de Aplicacion no conoce detalles de infraestructura (bases de datos ni frameworks web), y los adaptadores interactuan con la aplicacion unicamente mediante **Puertos (Interfaces)**.

---

## 2. Componentes de `booking-service` (Patron Saga - Orquestador)

### 2.1 Diagrama de Componentes C4

```mermaid
flowchart TD
    classDef domain fill:#1e3a8a,stroke:#60a5fa,stroke-width:2px,color:#ffffff;
    classDef app fill:#065f46,stroke:#34d399,stroke-width:2px,color:#ffffff;
    classDef adapter fill:#7c2d12,stroke:#fb923c,stroke-width:2px,color:#ffffff;
    classDef infra fill:#374151,stroke:#9ca3af,stroke-width:2px,color:#ffffff;

    subgraph InfraLayer["Infraestructura"]
        ExpressServer["Express Router & Middleware"]:::infra
        TypeORMRepo["TypeORM Booking & Compensation Repos"]:::infra
        StructuredLogger["Structured Logger (Correlation ID)"]:::infra
    end

    subgraph AdapterLayer["Adaptadores (Interface Adapters)"]
        SagaController["SagaController<br/>[HTTP Controller]"]:::adapter
        BookingController["BookingController<br/>[HTTP Controller]"]:::adapter
        HttpTripGateway["HttpTripServiceGateway<br/>[Implements ITripGateway]"]:::adapter
        HttpProviderGateway["HttpProviderServiceGateway<br/>[Implements IProviderGateway]"]:::adapter
    end

    subgraph AppLayer["Aplicacion (Application Core)"]
        SagaOrchestrator["SagaOrchestrator<br/>[Coordinador de Transaccion Distribuida]"]:::app
        CreateBookingUC["CreateBookingUseCase"]:::app
        CancelBookingUC["CancelBookingUseCase (Compensacion)"]:::app
        
        %% Puertos
        ITripPort["Interface: ITripGateway"]:::app
        IProvPort["Interface: IProviderGateway"]:::app
        IBookingRepo["Interface: IBookingRepository"]:::app
    end

    subgraph DomainLayer["Dominio (Domain Entities)"]
        BookingEntity["Booking & BookingItem"]:::domain
        BookingStatusEnum["BookingStatus (PENDING, CONFIRMED, CANCELLED)"]:::domain
        CompensationLog["CompensationLog Entity"]:::domain
    end

    %% Relaciones
    ExpressServer --> SagaController
    ExpressServer --> BookingController

    SagaController --> SagaOrchestrator
    BookingController --> CreateBookingUC
    BookingController --> CancelBookingUC

    SagaOrchestrator --> CreateBookingUC
    SagaOrchestrator --> CancelBookingUC
    SagaOrchestrator --> ITripPort
    SagaOrchestrator --> IProvPort
    SagaOrchestrator --> StructuredLogger

    HttpTripGateway -.->|Implements| ITripPort
    HttpProviderGateway -.->|Implements| IProvPort
    TypeORMRepo -.->|Implements| IBookingRepo

    CreateBookingUC --> BookingEntity
    CancelBookingUC --> BookingEntity
    SagaOrchestrator --> CompensationLog
```

### 2.2 Secuencia de la Transaccion Distribuida Saga

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as API Gateway / Cliente
    participant Saga as SagaOrchestrator
    participant Trip as Trip Service
    participant Booking as Booking Service (Local)
    participant Provider as Provider Service
    participant Log as CompensationLog

    Cliente->>Saga: POST /api/v1/saga/confirm-trip (tripData)
    Note over Saga: Paso 1: Crear viaje en Trip Service
    Saga->>Trip: POST /api/v1/trips (status: PENDING)
    Trip-->>Saga: 201 Created (tripId: "TRIP-123")
    
    Note over Saga: Paso 2: Crear reserva local
    Saga->>Booking: CreateBookingUseCase(tripId, status: PENDING)
    Booking-->>Saga: Booking Creada (bookingId: "BKG-456")

    Note over Saga: Paso 3: Verificar disponibilidad externa
    Saga->>Provider: POST /api/v1/providers/check-availability
    
    alt Disponibilidad Confirmada (Flujo Feliz)
        Provider-->>Saga: 200 OK (available: true)
        Note over Saga: Paso 4: Confirmar entidades
        Saga->>Booking: Actualizar status: CONFIRMED
        Saga->>Trip: PATCH /api/v1/trips/TRIP-123 (status: CONFIRMED)
        Saga-->>Cliente: 200 OK { success: true, status: "CONFIRMED" }
    else Proveedor Falla o No Disponible (Rollback Compensatorio)
        Provider-->>Saga: 503 Indisponible / 400 Error
        Note over Saga,Log: Activando compensacion automatica
        Saga->>Booking: CancelBookingUseCase(bookingId) -> status: CANCELLED
        Saga->>Trip: PATCH /api/v1/trips/TRIP-123 (status: CANCELLED)
        Saga->>Log: Registrar traza completa (correlationId, motivo del fallo)
        Saga-->>Cliente: 422 Unprocessable Entity { success: false, status: "COMPENSATED" }
    end
```

---

## 3. Componentes de `provider-service` (Patron Adapter)

### 3.1 Diagrama de Componentes C4

```mermaid
flowchart TD
    classDef domain fill:#1e3a8a,stroke:#60a5fa,stroke-width:2px,color:#ffffff;
    classDef app fill:#065f46,stroke:#34d399,stroke-width:2px,color:#ffffff;
    classDef adapter fill:#7c2d12,stroke:#fb923c,stroke-width:2px,color:#ffffff;
    classDef infra fill:#374151,stroke:#9ca3af,stroke-width:2px,color:#ffffff;
    classDef ext fill:#1f2937,stroke:#9ca3af,stroke-width:1px,stroke-dasharray: 4 4,color:#cbd5e1;

    subgraph InfraLayer["Infraestructura"]
        ExpressRoutes["Express Router & Chaos Middleware"]:::infra
        ChaosController["Simulate-Failure Controller (?mode=unavailable)"]:::infra
        MockInventory["Mock Inventory & In-Memory Store"]:::infra
    end

    subgraph AdapterLayer["Adaptadores (Interface Adapters)"]
        ProviderController["ProviderController<br/>[HTTP REST]"]:::adapter
        Registry["ProveedorExternoRegistry<br/>[Factory & Resolver de Adaptadores]"]:::adapter
        
        TransporteAdapter["TransporteAdapter<br/>[Implements IProveedorExterno]"]:::adapter
        AlojamientoAdapter["AlojamientoAdapter<br/>[Implements IProveedorExterno]"]:::adapter
        ActividadAdapter["ActividadAdapter<br/>[Implements IProveedorExterno]"]:::adapter
    end

    subgraph AppLayer["Aplicacion (Application Core)"]
        CheckAvailUC["CheckAvailabilityUseCase"]:::app
        VerifyProvUC["VerifyProviderUseCase"]:::app
        IProvPort["Interface: IProveedorExterno<br/>[Target GoF Interface]"]:::app
    end

    subgraph DomainLayer["Dominio (Domain Entities)"]
        ProviderEntity["Provider Entity"]:::domain
        ServiceOfferEntity["ServiceOffer (Vuelo, Hotel, Tour)"]:::domain
        VerificationStatus["Status: VERIFIED, PENDING, REJECTED"]:::domain
    end

    subgraph ExtAPIs["APIs Externas Heterogeneas (Adaptees)"]
        FlightAPI["SerpAPI / Google Flights REST API"]:::ext
        HotelsAPI["Hotels API / Booking JSON API"]:::ext
    end

    %% Conexiones
    ExpressRoutes --> ProviderController
    ExpressRoutes --> ChaosController
    ChaosController -.->|"Interrumpe flujo en modo unavailable"| CheckAvailUC

    ProviderController --> CheckAvailUC
    ProviderController --> VerifyProvUC

    CheckAvailUC --> Registry
    Registry --> TransporteAdapter
    Registry --> AlojamientoAdapter
    Registry --> ActividadAdapter

    TransporteAdapter -.->|Implements| IProvPort
    AlojamientoAdapter -.->|Implements| IProvPort
    ActividadAdapter -.->|Implements| IProvPort

    TransporteAdapter -->|"Traduce a SerpAPI format"| FlightAPI
    AlojamientoAdapter -->|"Traduce a Hotels API format"| HotelsAPI
    ActividadAdapter --> MockInventory

    CheckAvailUC --> ProviderEntity
    VerifyProvUC --> ProviderEntity
```

### 3.2 Justificacion del Patron Adapter
Las APIs de aerolineas (`SerpAPI / Google Flights`) y hoteles (`Hotels API`) poseen firmas, nombres de campos, parametros y formatos de respuesta dispares. El patron **Adapter**:
1. Define la interfaz uniforme `IProveedorExterno` en la capa de aplicacion con los metodos:
   - `consultarDisponibilidad(criterios: DisponibilidadQuery): Promise<DisponibilidadResultado>`
   - `confirmarReserva(datos: ReservaDatos): Promise<ConfirmacionResultado>`
2. Los adaptadores concretos (`TransporteAdapter`, `AlojamientoAdapter`) traducen los objetos del dominio Wayvo hacia el payload especifico de cada proveedor externo.
3. Si un proveedor externo cambia su esquema JSON o se reemplaza por otro, el codigo de negocio y los casos de uso no sufren modificaciones; unicamente se actualiza el adaptador correspondiente.

---

## 4. Componentes de `trip-service` (Patron Mediator)

### 4.1 Diagrama de Componentes C4

```mermaid
flowchart TD
    classDef domain fill:#1e3a8a,stroke:#60a5fa,stroke-width:2px,color:#ffffff;
    classDef app fill:#065f46,stroke:#34d399,stroke-width:2px,color:#ffffff;
    classDef adapter fill:#7c2d12,stroke:#fb923c,stroke-width:2px,color:#ffffff;
    classDef infra fill:#374151,stroke:#9ca3af,stroke-width:2px,color:#ffffff;

    subgraph InfraLayer["Infraestructura"]
        HTTPRouter["Express Router /api/v1/trips"]:::infra
        TripDBRepo["TypeORM Trip & Event Repositories"]:::infra
        AIClient["HTTP Client -> ai-recommendation (:8000)"]:::infra
    end

    subgraph AdapterLayer["Adaptadores (Interface Adapters)"]
        TripController["TripController"]:::adapter
        EventController["EventController"]:::adapter
    end

    subgraph AppLayer["Aplicacion (Application Core)"]
        IMediator["Interface: IMediator<br/>notify(sender, event, data)"]:::app
        TripMediator["TripMediator<br/>[Mediador Central Concreto]"]:::app
        
        %% Colegas
        EventService["EventService<br/>[Colleague 1 - Registra eventos e incidencias]"]:::app
        AlternativeService["AlternativeService<br/>[Colleague 2 - Genera opciones via IA]"]:::app
        TripService["TripService<br/>[Colleague 3 - Actualiza estado de viajes e itinerario]"]:::app
    end

    subgraph DomainLayer["Dominio (Domain Entities)"]
        TripEntity["Trip Entity (DRAFT, CONFIRMED, CANCELLED)"]:::domain
        ItineraryEntity["Itinerary & DayPlan"]:::domain
        EventEntity["Event (CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED)"]:::domain
        IncidentEntity["IncidentEvent & AlternativeOption"]:::domain
    end

    %% Conexiones
    HTTPRouter --> TripController
    HTTPRouter --> EventController

    TripController --> TripService
    EventController --> TripMediator

    TripMediator -.->|Implements| IMediator
    TripMediator --> EventService
    TripMediator --> AlternativeService
    TripMediator --> TripService

    AlternativeService --> AIClient
    TripService --> TripDBRepo
    EventService --> TripDBRepo

    TripService --> TripEntity
    EventService --> EventEntity
    AlternativeService --> IncidentEntity
```

### 4.2 Interaccion del Mediador ante una Incidencia en Ruta

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Viajero / UI
    participant Ctrl as EventController
    participant Med as TripMediator
    participant EvtSvc as EventService
    participant AltSvc as AlternativeService
    participant AISvc as AI Recommendation
    participant TripSvc as TripService

    Usuario->>Ctrl: POST /trips/:id/incidents (motivo: "Vuelo cancelado")
    Ctrl->>Med: notify(this, "INCIDENT_REPORTED", payload)
    
    Note over Med: 1. El Mediador instruye registrar la incidencia
    Med->>EvtSvc: registerIncident(tripId, eventId, reason)
    EvtSvc-->>Med: Incidencia Registrada en BD

    Note over Med: 2. El Mediador solicita alternativas inteligentes
    Med->>AltSvc: generateAlternatives(tripId, incident)
    AltSvc->>AISvc: POST /api/v1/recommend/incident-resolution
    AISvc-->>AltSvc: 3 Opciones (ej. Hotel express, Tren nocturno)
    AltSvc-->>Med: Alternativas consolidadas

    Med-->>Ctrl: Opciones retornadas al usuario
    Ctrl-->>Usuario: Modal con alternativas sugeridas por IA

    Note over Usuario,Med: 3. El usuario selecciona la alternativa #1
    Usuario->>Ctrl: POST /trips/:id/resolve-incident (selectedAlternativeId)
    Ctrl->>Med: notify(this, "RESOLVE_INCIDENT", payload)

    Med->>EvtSvc: markEventAsCancelled(originalEventId, reason)
    Med->>TripSvc: injectAlternativeEvent(tripId, dayIndex, newEvent)
    TripSvc-->>Med: Itinerario actualizado
    Med-->>Ctrl: Confirmacion de sustitucion
    Ctrl-->>Usuario: 200 OK (Itinerario re-planificado en tiempo real)
```

---

## 5. Tabla Maestra de Mapeo Arquitectonico

| Patron | Capa Clean Architecture | Archivos Clave en el Repositorio | Responsabilidad del Componente |
| :--- | :--- | :--- | :--- |
| **Saga (Orquestador)** | `application/saga` | [`saga-orchestrator.ts`](file:///Users/alexy/Documents/Uninorte/Octavo%20Semestre/Disen%CC%83o%202/Wayvo/services/booking-service/src/application/saga/saga-orchestrator.ts) | Coordina el ciclo de vida de la transaccion distribuida, bifurcaciones de rollback y registro de `CompensationLog`. |
| **Facade** | `application/facades` | [`trip.facade.ts`](file:///Users/alexy/Documents/Uninorte/Octavo%20Semestre/Disen%CC%83o%202/Wayvo/services/api-gateway/src/application/facades/trip.facade.ts) | Unifica llamadas a IA y Booking; expone interfaces simplificadas al cliente frontend. |
| **Adapter** | `adapters/external` | [`transporte.adapter.ts`](file:///Users/alexy/Documents/Uninorte/Octavo%20Semestre/Disen%CC%83o%202/Wayvo/services/provider-service/src/adapters/external/transporte.adapter.ts)<br/>[`alojamiento.adapter.ts`](file:///Users/alexy/Documents/Uninorte/Octavo%20Semestre/Disen%CC%83o%202/Wayvo/services/provider-service/src/adapters/external/alojamiento.adapter.ts) | Traducen esquemas de proveedores de vuelos y hoteles al puerto target `IProveedorExterno`. |
| **Mediator** | `application/mediator` | [`TripMediator.ts`](file:///Users/alexy/Documents/Uninorte/Octavo%20Semestre/Disen%CC%83o%202/Wayvo/services/trip-service/src/application/mediator/TripMediator.ts)<br/>[`IMediator.ts`](file:///Users/alexy/Documents/Uninorte/Octavo%20Semestre/Disen%CC%83o%202/Wayvo/services/trip-service/src/application/mediator/IMediator.ts) | Centraliza las notificaciones entre `EventService`, `AlternativeService` y `TripService` evitando dependencias cruzadas. |
