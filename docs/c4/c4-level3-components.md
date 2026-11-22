# C4 Model - Nivel 3: Componentes y Clean Architecture

## 1. Clean Architecture en Wayvo

Los microservicios en Node.js (`auth-service`, `booking-service`, `provider-service`, `trip-service`) y el `api-gateway` siguen **Clean Architecture** con cuatro capas:

```text
       ┌─────────────────────────────────────────────────────────┐
       │                   INFRASTRUCTURE                        │
       │  (Prisma, Express, bcrypt, JWT, clientes HTTP, logger)  │
       │   ┌─────────────────────────────────────────────────┐   │
       │   │                    ADAPTERS                     │   │
       │   │  (Controllers, rutas, middlewares, gateways)    │   │
       │   │   ┌─────────────────────────────────────────┐   │   │
       │   │   │               APPLICATION               │   │   │
       │   │   │ (Casos de uso, puertos, Saga, Mediator) │   │   │
       │   │   │   ┌─────────────────────────────────┐   │   │   │
       │   │   │   │             DOMAIN              │   │   │   │
       │   │   │   │ (Entidades, value objects, enums)│  │   │   │
       │   │   │   └─────────────────────────────────┘   │   │   │
       │   │   └─────────────────────────────────────────┘   │   │
       │   └─────────────────────────────────────────────────┘   │
       └─────────────────────────────────────────────────────────┘
```

**Regla de dependencia:** el código apunta siempre hacia adentro. El dominio no conoce a nadie; la aplicación habla con el exterior solo mediante **puertos** (interfaces); las implementaciones concretas (Prisma, HTTP, bcrypt, JWT) se eligen únicamente en el `container.ts` de cada servicio (raíz de composición).

---

## 2. `auth-service` (multiusuario)

### 2.1 Componentes

```mermaid
flowchart TD
    classDef domain fill:#1e3a8a,stroke:#60a5fa,stroke-width:2px,color:#ffffff;
    classDef app fill:#065f46,stroke:#34d399,stroke-width:2px,color:#ffffff;
    classDef adapter fill:#7c2d12,stroke:#fb923c,stroke-width:2px,color:#ffffff;
    classDef infra fill:#374151,stroke:#9ca3af,stroke-width:2px,color:#ffffff;

    subgraph InfraLayer["Infraestructura"]
        Express["Express 5 + middlewares<br/>(correlation ID, logger, errores)"]:::infra
        Bcrypt["BcryptPasswordHasher"]:::infra
        Jwt["JwtTokenService (HS256)"]:::infra
        PrismaUser["PrismaUserRepository"]:::infra
    end

    subgraph AdapterLayer["Adaptadores"]
        AuthCtrl["AuthController<br/>register / login / me"]:::adapter
    end

    subgraph AppLayer["Aplicación"]
        RegisterUC["RegisterUserUseCase"]:::app
        LoginUC["LoginUserUseCase"]:::app
        MeUC["GetCurrentUserUseCase"]:::app
        HasherPort["Puerto: PasswordHasher"]:::app
        TokenPort["Puerto: TokenService"]:::app
    end

    subgraph DomainLayer["Dominio"]
        UserEntity["User (email normalizado, passwordHash)"]:::domain
        RoleEnum["UserRole (TRAVELER, ADMIN)"]:::domain
        UserRepoPort["Puerto: UserRepository"]:::domain
    end

    Express --> AuthCtrl
    AuthCtrl --> RegisterUC
    AuthCtrl --> LoginUC
    AuthCtrl --> MeUC

    RegisterUC --> HasherPort
    RegisterUC --> TokenPort
    RegisterUC --> UserRepoPort
    LoginUC --> HasherPort
    LoginUC --> TokenPort
    LoginUC --> UserRepoPort
    MeUC --> TokenPort
    MeUC --> UserRepoPort

    Bcrypt -.->|Implements| HasherPort
    Jwt -.->|Implements| TokenPort
    PrismaUser -.->|Implements| UserRepoPort

    RegisterUC --> UserEntity
    UserEntity --> RoleEnum
```

### 2.2 Secuencia: login y petición autenticada

```mermaid
sequenceDiagram
    autonumber
    actor V as Viajero (cliente web)
    participant GW as API Gateway
    participant Auth as auth-service
    participant Trip as trip-service

    V->>GW: POST /api/v1/auth/login {email, password}
    Note over GW: Ruta pública: no exige token
    GW->>Auth: proxy
    Auth->>Auth: LoginUserUseCase: buscar usuario + bcrypt.compare
    Auth-->>GW: 200 {token (JWT), expiresAt, user}
    GW-->>V: 200
    Note over V: Guarda el token (localStorage)

    V->>GW: GET /api/v1/trips  (Authorization: Bearer JWT, x-user-id falso)
    Note over GW: authMiddleware:<br/>1. borra x-user-id del cliente<br/>2. verifica la firma del JWT (JWT_SECRET)<br/>3. escribe x-user-id = sub del token
    GW->>Trip: GET /api/v1/trips (x-user-id: id real)
    Trip-->>GW: 200 solo los viajes de ese usuario
    GW-->>V: 200

    V->>GW: GET /api/v1/trips (token alterado o expirado)
    GW-->>V: 401 UNAUTHENTICATED (el cliente cierra la sesión)
```

---

## 3. `booking-service` (patrón Saga - orquestador)

### 3.1 Componentes

```mermaid
flowchart TD
    classDef domain fill:#1e3a8a,stroke:#60a5fa,stroke-width:2px,color:#ffffff;
    classDef app fill:#065f46,stroke:#34d399,stroke-width:2px,color:#ffffff;
    classDef adapter fill:#7c2d12,stroke:#fb923c,stroke-width:2px,color:#ffffff;
    classDef infra fill:#374151,stroke:#9ca3af,stroke-width:2px,color:#ffffff;

    subgraph InfraLayer["Infraestructura"]
        ExpressServer["Express 5 + middlewares"]:::infra
        PrismaRepos["PrismaBookingRepository<br/>PrismaCompensationLogRepository"]:::infra
        Logger["ConsoleLogger (JSON + correlation ID)"]:::infra
    end

    subgraph AdapterLayer["Adaptadores"]
        SagaController["SagaController"]:::adapter
        BookingController["BookingController"]:::adapter
        HttpTripGateway["HttpTripServiceGateway"]:::adapter
        HttpProviderGateway["HttpProviderServiceGateway"]:::adapter
    end

    subgraph AppLayer["Aplicación"]
        SagaOrchestrator["SagaOrchestrator"]:::app
        CreateBookingUC["CreateBookingUseCase"]:::app
        ConfirmBookingUC["ConfirmBookingUseCase"]:::app
        CancelBookingUC["CancelBookingUseCase (compensación)"]:::app
        GetBookingUC["GetBookingUseCase (verifica dueño)"]:::app
        ITripPort["Puerto: TripServiceGateway"]:::app
        IProvPort["Puerto: ProviderServiceGateway"]:::app
    end

    subgraph DomainLayer["Dominio"]
        BookingEntity["Booking + BookingItem"]:::domain
        BookingStatusEnum["BookingStatus (PENDING, CONFIRMED, CANCELLED)"]:::domain
        CompensationLog["CompensationLog (pasos y resultado)"]:::domain
        RepoPorts["Puertos: BookingRepository,<br/>CompensationLogRepository"]:::domain
    end

    ExpressServer --> SagaController
    ExpressServer --> BookingController

    SagaController --> SagaOrchestrator
    BookingController --> CreateBookingUC
    BookingController --> CancelBookingUC
    BookingController --> GetBookingUC

    SagaOrchestrator --> CreateBookingUC
    SagaOrchestrator --> ConfirmBookingUC
    SagaOrchestrator --> CancelBookingUC
    SagaOrchestrator --> ITripPort
    SagaOrchestrator --> IProvPort
    SagaOrchestrator --> CompensationLog
    SagaOrchestrator --> Logger

    HttpTripGateway -.->|Implements| ITripPort
    HttpProviderGateway -.->|Implements| IProvPort
    PrismaRepos -.->|Implements| RepoPorts

    CreateBookingUC --> BookingEntity
    CancelBookingUC --> BookingEntity
    BookingEntity --> BookingStatusEnum
```

### 3.2 Secuencia de la Saga

```mermaid
sequenceDiagram
    autonumber
    actor GW as API Gateway (TripFacade.checkoutTrip)
    participant Saga as SagaOrchestrator
    participant Trip as trip-service
    participant Booking as Booking (local)
    participant Provider as provider-service
    participant Log as CompensationLog

    GW->>Saga: POST /api/v1/saga/confirm-trip (x-user-id)
    Note over Saga: Paso CREATE_TRIP
    Saga->>Trip: POST /api/v1/trips (viaje PENDING del usuario)
    Trip-->>Saga: 201 {id}
    Note over Saga: Paso CREATE_BOOKING
    Saga->>Booking: CreateBookingUseCase (reserva PENDING)
    Note over Saga: Paso RESERVE_PROVIDER
    Saga->>Provider: POST /providers/check-availability
    Saga->>Provider: POST /providers/confirm (cupo atómico + proveedor externo)

    alt Todo OK
        Provider-->>Saga: {reservationCode}
        Note over Saga: Paso CONFIRM
        Saga->>Booking: ConfirmBookingUseCase → CONFIRMED
        Saga->>Trip: POST /api/v1/trips/{id}/confirm
        Saga-->>GW: 201 {status: CONFIRMED}
    else Proveedor falla o sin cupo
        Provider-->>Saga: no disponible / error
        Note over Saga,Log: Compensación en orden inverso (pila LIFO)
        Saga->>Booking: CancelBookingUseCase → CANCELLED
        Saga->>Trip: POST /api/v1/trips/{id}/cancel
        Saga->>Log: guarda traza (correlationId, paso fallido, motivo)
        Saga-->>GW: 409 SAGA_COMPENSATED (500 si la compensación falló)
    end
```

---

## 4. `provider-service` (patrón Adapter)

### 4.1 Componentes

```mermaid
flowchart TD
    classDef domain fill:#1e3a8a,stroke:#60a5fa,stroke-width:2px,color:#ffffff;
    classDef app fill:#065f46,stroke:#34d399,stroke-width:2px,color:#ffffff;
    classDef adapter fill:#7c2d12,stroke:#fb923c,stroke-width:2px,color:#ffffff;
    classDef infra fill:#374151,stroke:#9ca3af,stroke-width:2px,color:#ffffff;
    classDef ext fill:#1f2937,stroke:#9ca3af,stroke-width:1px,stroke-dasharray: 4 4,color:#cbd5e1;

    subgraph InfraLayer["Infraestructura"]
        Routers["Express: providers.router y mock.router"]:::infra
        Clients["SerpApiFlightsClient, HotelsApiClient<br/>(o clientes mock del simulador)"]:::infra
        PrismaOffers["PrismaServiceOfferRepository<br/>(UPDATE atómico de cupos)"]:::infra
        Chaos["MockSimulationState (modo caos)"]:::infra
    end

    subgraph AdapterLayer["Adaptadores"]
        Registry["ProveedorExternoRegistry<br/>(elige el adapter por tipo)"]:::adapter
        TransporteAdapter["TransporteAdapter"]:::adapter
        AlojamientoAdapter["AlojamientoAdapter"]:::adapter
        ActividadAdapter["ActividadAdapter"]:::adapter
    end

    subgraph AppLayer["Aplicación"]
        CheckAvailUC["CheckAvailabilityUseCase"]:::app
        ConfirmUC["ConfirmReservationUseCase"]:::app
        ListUC["ListProvidersUseCase"]:::app
        VerifyUC["VerifyProviderUseCase"]:::app
        IProvPort["Puerto (Target): IProveedorExterno"]:::app
    end

    subgraph DomainLayer["Dominio"]
        ProviderEntity["Provider (VERIFIED, PENDING, REJECTED)"]:::domain
        OfferEntity["ServiceOffer (cupo, precio, metadata)"]:::domain
        OfferRepoPort["Puerto: ServiceOfferRepository<br/>tryReserve / releaseCapacity"]:::domain
    end

    subgraph Ext["APIs externas (Adaptees)"]
        FlightAPI["SerpAPI / Google Flights"]:::ext
        HotelsAPI["Hotels API"]:::ext
    end

    Routers --> CheckAvailUC
    Routers --> ConfirmUC
    Routers --> ListUC
    Routers --> Chaos

    CheckAvailUC --> Registry
    ConfirmUC --> Registry
    ConfirmUC --> OfferRepoPort
    Registry --> TransporteAdapter
    Registry --> AlojamientoAdapter
    Registry --> ActividadAdapter

    TransporteAdapter -.->|Implements| IProvPort
    AlojamientoAdapter -.->|Implements| IProvPort
    ActividadAdapter -.->|Implements| IProvPort
    PrismaOffers -.->|Implements| OfferRepoPort

    TransporteAdapter --> Clients
    AlojamientoAdapter --> Clients
    Clients --> FlightAPI
    Clients --> HotelsAPI

    ConfirmUC --> OfferEntity
    VerifyUC --> ProviderEntity
```

### 4.2 Por qué Adapter
SerpAPI y Hotels API tienen firmas, parámetros y respuestas distintas. `IProveedorExterno` define una interfaz única (`consultarDisponibilidad`, `confirmarReserva`) y cada adapter traduce el modelo de Wayvo al formato del proveedor. Cambiar de proveedor implica solo un adapter nuevo: los casos de uso no cambian.

### 4.3 Reserva atómica de cupos (concurrencia multiusuario)
`ConfirmReservationUseCase` primero **aparta el cupo** con `tryReserve` (un `UPDATE ... WHERE available_capacity >= n` que PostgreSQL ejecuta de forma atómica), luego confirma con el proveedor externo y, si este falla, **devuelve el cupo** con `releaseCapacity`. `save()` nunca sobrescribe el cupo, para que un guardado con datos viejos no pise una reserva concurrente.

---

## 5. `trip-service` (patrón Mediator)

### 5.1 Componentes

```mermaid
flowchart TD
    classDef domain fill:#1e3a8a,stroke:#60a5fa,stroke-width:2px,color:#ffffff;
    classDef app fill:#065f46,stroke:#34d399,stroke-width:2px,color:#ffffff;
    classDef adapter fill:#7c2d12,stroke:#fb923c,stroke-width:2px,color:#ffffff;
    classDef infra fill:#374151,stroke:#9ca3af,stroke-width:2px,color:#ffffff;

    subgraph InfraLayer["Infraestructura"]
        HTTPRouter["Express /api/v1/trips"]:::infra
        PrismaRepos["PrismaTripRepository<br/>PrismaIncidentRepository"]:::infra
    end

    subgraph AdapterLayer["Adaptadores"]
        Ownership["requireTripOwnership<br/>(middleware x-user-id)"]:::adapter
        TripController["TripController"]:::adapter
        EventController["EventController"]:::adapter
    end

    subgraph AppLayer["Aplicación"]
        IMediator["Interfaz IMediator<br/>reportIncident / selectAlternative"]:::app
        TripMediator["TripMediator"]:::app
        EventService["EventService<br/>(registra y resuelve incidentes)"]:::app
        AlternativeService["AlternativeService<br/>(genera alternativas por reglas)"]:::app
        TripService["TripService<br/>(itinerario y getTripForUser)"]:::app
        RepoPorts["Puertos: ITripRepository,<br/>IIncidentRepository"]:::app
    end

    subgraph DomainLayer["Dominio"]
        TripEntity["Trip (PENDING, CONFIRMED, ACTIVE, CANCELLED)<br/>isOwnedBy(userId)"]:::domain
        EventEntity["Event (PENDING, IN_PROGRESS, COMPLETED, ISSUE, CANCELLED)"]:::domain
        IncidentEntity["IncidentEvent + AlternativeOption"]:::domain
        ItineraryEntity["Itinerary + DayPlan (derivados de los eventos)"]:::domain
    end

    HTTPRouter --> Ownership
    Ownership --> TripController
    Ownership --> EventController
    Ownership --> TripService

    TripController --> TripService
    EventController --> IMediator
    TripMediator -.->|Implements| IMediator
    TripMediator --> EventService
    TripMediator --> AlternativeService
    TripMediator --> TripService

    TripService --> RepoPorts
    EventService --> RepoPorts
    PrismaRepos -.->|Implements| RepoPorts

    TripService --> TripEntity
    TripEntity --> EventEntity
    TripEntity --> ItineraryEntity
    EventService --> IncidentEntity
    AlternativeService --> IncidentEntity
```

`EventService`, `AlternativeService` y `TripService` **no se conocen entre sí**: solo el `TripMediator` los coordina (hay un test que verifica ese desacoplamiento).

### 5.2 Secuencia: incidencia en ruta

```mermaid
sequenceDiagram
    autonumber
    actor V as Viajero
    participant Ctrl as EventController
    participant Med as TripMediator
    participant TripSvc as TripService
    participant AltSvc as AlternativeService
    participant EvtSvc as EventService

    V->>Ctrl: POST /trips/:id/incidents {eventId, type, reason}
    Note over Ctrl: Antes, requireTripOwnership verificó que el viaje sea del usuario
    Ctrl->>Med: reportIncident(input)
    Med->>TripSvc: getTrip(tripId)
    Med->>AltSvc: generate(type, event)
    AltSvc-->>Med: alternativas (la primera, recomendada)
    Med->>TripSvc: reportIssue(...) → evento en ISSUE con alternativas
    Med->>EvtSvc: register(tripId, eventId, type, reason)
    Med-->>Ctrl: evento afectado + alternativas
    Ctrl-->>V: 200

    V->>Ctrl: POST /trips/:id/alternatives {eventId, alternativeId}
    Ctrl->>Med: selectAlternative(input)
    Med->>TripSvc: selectAlternative(...) → cancela el evento e inserta los nuevos
    Med->>EvtSvc: resolve(tripId, eventId)
    Med-->>Ctrl: itinerario actualizado
    Ctrl-->>V: 200
```

> Además, el cliente puede pedir alternativas contextuales a la IA (`POST /api/v1/ai/incidents/resolve`, agente `incident_agent`) y aplicarlas con `POST /trips/:id/resolve-incident`.

---

## 6. Tabla Maestra de Mapeo Arquitectónico

| Patrón / mecanismo | Capa | Archivos clave | Responsabilidad |
| :--- | :--- | :--- | :--- |
| **Saga (orquestador)** | `application/saga` | [`saga-orchestrator.ts`](../../services/booking-service/src/application/saga/saga-orchestrator.ts) | Pasos hacia adelante, compensación en orden inverso y `CompensationLog`. |
| **Facade** | `application/facades` | [`trip.facade.ts`](../../services/api-gateway/src/application/facades/trip.facade.ts) | Unifica IA (plan) y Saga (checkout) en endpoints simples para el cliente. |
| **Adapter** | `adapters/external` | [`proveedor-externo.port.ts`](../../services/provider-service/src/application/ports/proveedor-externo.port.ts), [`transporte.adapter.ts`](../../services/provider-service/src/adapters/external/transporte.adapter.ts), [`alojamiento.adapter.ts`](../../services/provider-service/src/adapters/external/alojamiento.adapter.ts) | Traducen SerpAPI y Hotels API al puerto `IProveedorExterno`. |
| **Mediator** | `application/mediator` | [`IMediator.ts`](../../services/trip-service/src/application/mediator/IMediator.ts), [`TripMediator.ts`](../../services/trip-service/src/application/mediator/TripMediator.ts) | Coordina `EventService`, `AlternativeService` y `TripService` sin dependencias cruzadas. |
| **Autenticación JWT** | gateway `adapters/http/middlewares` + `auth-service` | [`auth.middleware.ts`](../../services/api-gateway/src/adapters/http/middlewares/auth.middleware.ts), [`jwt-token.service.ts`](../../services/auth-service/src/infrastructure/token/jwt-token.service.ts), [`register-user.use-case.ts`](../../services/auth-service/src/application/use-cases/register-user.use-case.ts) | Emisión y verificación de tokens, propagación de identidad, roles. |
| **Aislamiento por usuario** | trip / booking | [`identity.ts`](../../services/trip-service/src/adapters/middlewares/identity.ts), [`get-booking.use-case.ts`](../../services/booking-service/src/application/use-cases/get-booking.use-case.ts) | Cada usuario solo ve y modifica lo suyo (404 si es ajeno). |
| **Reserva atómica** | provider `infrastructure/persistence` | [`prisma-service-offer.repository.ts`](../../services/provider-service/src/infrastructure/persistence/prisma/prisma-service-offer.repository.ts), [`confirm-reservation.use-case.ts`](../../services/provider-service/src/application/use-cases/confirm-reservation.use-case.ts) | Evita vender dos veces el mismo cupo con usuarios concurrentes. |
