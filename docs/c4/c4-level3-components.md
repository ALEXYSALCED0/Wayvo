# C4 Model - Nivel 3: Componentes y Clean Architecture

## 1. Clean Architecture en Wayvo

Los microservicios en Node.js (`auth-service`, `booking-service`, `provider-service`, `payment-service`, `trip-service`) y el `api-gateway` siguen **Clean Architecture** con cuatro capas:

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
        PrismaUsage["PrismaAiPlanUsageRepository<br/>(UPDATE atómico del contador)"]:::infra
    end

    subgraph AdapterLayer["Adaptadores"]
        AuthCtrl["AuthController<br/>register / login / me"]:::adapter
        InternalCtrl["InternalController + internalTokenMiddleware<br/>(rutas /api/v1/internal, solo servicio a servicio)"]:::adapter
    end

    subgraph AppLayer["Aplicación"]
        RegisterUC["RegisterUserUseCase"]:::app
        LoginUC["LoginUserUseCase"]:::app
        MeUC["GetCurrentUserUseCase<br/>(incluye entitlements)"]:::app
        SetPlanUC["SetAccountPlanUseCase"]:::app
        ConsumeUC["ConsumeAiPlanUseCase"]:::app
        ReleaseUC["ReleaseAiPlanUseCase"]:::app
        HasherPort["Puerto: PasswordHasher"]:::app
        TokenPort["Puerto: TokenService"]:::app
    end

    subgraph DomainLayer["Dominio"]
        UserEntity["User (email normalizado, passwordHash)"]:::domain
        RoleEnum["UserRole (TRAVELER, ADMIN)<br/>AccountPlan (FREE, PREMIUM)"]:::domain
        PlanPolicyNode["PlanPolicy<br/>(límites de cada plan)"]:::domain
        UserRepoPort["Puerto: UserRepository"]:::domain
        UsageRepoPort["Puerto: AiPlanUsageRepository<br/>tryConsume / release"]:::domain
    end

    Express --> AuthCtrl
    Express --> InternalCtrl
    InternalCtrl --> SetPlanUC
    InternalCtrl --> ConsumeUC
    InternalCtrl --> ReleaseUC
    SetPlanUC --> UserRepoPort
    ConsumeUC --> UserRepoPort
    ConsumeUC --> UsageRepoPort
    ConsumeUC --> PlanPolicyNode
    ReleaseUC --> UsageRepoPort
    MeUC --> UsageRepoPort
    MeUC --> PlanPolicyNode
    PrismaUsage -.->|Implements| UsageRepoPort
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
        HttpProviderGateway["HttpProviderServiceGateway<br/>(check, confirm y release)"]:::adapter
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
        Saga->>Provider: POST /api/v1/providers/release (COMPENSATE_PROVIDER: devuelve los cupos)
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
        ReleaseUC["ReleaseReservationUseCase<br/>(compensación de la Saga)"]:::app
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
    Routers --> ReleaseUC
    ReleaseUC --> OfferRepoPort
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

### 4.4 Liberación de cupos (compensación de la Saga)
Si la Saga falla **después** de reservar con los proveedores (por ejemplo, un paso posterior rechazado), los cupos apartados deben devolverse. `ReleaseReservationUseCase` expone `releaseCapacity` por `POST /api/v1/providers/release` (`{ bookingId, items: [{ offerId, quantity }] }`) y `booking-service` lo registra como compensación `COMPENSATE_PROVIDER`, que se ejecuta en orden inverso junto con las demás. El endpoint no es idempotente: repetir la misma liberación vuelve a devolver cupos.

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

## 6. `payment-service` (Adapter de pagos y Saga de activación)

### 6.1 Componentes

```mermaid
flowchart TD
    classDef domain fill:#1e3a8a,stroke:#60a5fa,stroke-width:2px,color:#ffffff;
    classDef app fill:#065f46,stroke:#34d399,stroke-width:2px,color:#ffffff;
    classDef adapter fill:#7c2d12,stroke:#fb923c,stroke-width:2px,color:#ffffff;
    classDef infra fill:#374151,stroke:#9ca3af,stroke-width:2px,color:#ffffff;
    classDef ext fill:#1f2937,stroke:#9ca3af,stroke-width:1px,stroke-dasharray: 4 4,color:#cbd5e1;

    subgraph InfraLayer["Infraestructura"]
        Routes["Express: payment.routes (webhook con cuerpo crudo)<br/>y mock.routes (simulador)"]:::infra
        StripeHttp["StripeHttpApi (Stripe real, API 2025-03-31.basil)<br/>+ verificación de firma del webhook"]:::infra
        FakeStripe["FakeStripeApi + PaymentSimulationState<br/>(simulador: normal, declined, error, slow)"]:::infra
        PrismaSubs["PrismaSubscriptionRepository"]:::infra
        FakeAccount["FakeAccountPlanGateway (solo desarrollo)"]:::infra
    end

    subgraph AdapterLayer["Adaptadores"]
        StripeAdapter["StripePaymentAdapter<br/>(Adapter: Stripe → IPaymentGateway)"]:::adapter
        HttpAccount["HttpAccountPlanGateway<br/>(PUT plan en auth-service + x-internal-token)"]:::adapter
        Identity["identityMiddleware<br/>(x-user-id, x-user-email del gateway)"]:::adapter
    end

    subgraph AppLayer["Aplicación"]
        CreateUC["CreateSubscriptionUseCase"]:::app
        ConfirmUC["ConfirmSubscriptionUseCase"]:::app
        ActivateUC["ActivateSubscriptionUseCase<br/>(Saga de activación)"]:::app
        CancelUC["CancelSubscriptionUseCase<br/>(compensación)"]:::app
        MyUC["GetMySubscriptionUseCase"]:::app
        WebhookUC["HandleWebhookUseCase"]:::app
        GatewayPort["Puerto (Target): IPaymentGateway"]:::app
        AccountPort["Puerto: AccountPlanGateway"]:::app
    end

    subgraph DomainLayer["Dominio"]
        SubEntity["Subscription<br/>(INCOMPLETE, ACTIVE, PAST_DUE, CANCELED)"]:::domain
        SubRepoPort["Puerto: SubscriptionRepository"]:::domain
    end

    subgraph Ext["Sistemas externos (Adaptees)"]
        StripeAPI["Stripe API"]:::ext
        AuthSvc["auth-service"]:::ext
    end

    Routes --> Identity
    Routes --> CreateUC
    Routes --> ActivateUC
    Routes --> CancelUC
    Routes --> MyUC
    Routes --> WebhookUC

    ActivateUC --> ConfirmUC
    ActivateUC --> CancelUC
    ActivateUC --> AccountPort
    CancelUC --> AccountPort
    WebhookUC --> AccountPort
    CreateUC --> GatewayPort
    ConfirmUC --> GatewayPort
    CancelUC --> GatewayPort
    WebhookUC --> GatewayPort
    CreateUC --> SubRepoPort
    ConfirmUC --> SubRepoPort
    CancelUC --> SubRepoPort
    WebhookUC --> SubRepoPort
    MyUC --> SubRepoPort
    CreateUC --> SubEntity

    StripeAdapter -.->|Implements| GatewayPort
    HttpAccount -.->|Implements| AccountPort
    FakeAccount -.->|Implements| AccountPort
    PrismaSubs -.->|Implements| SubRepoPort

    StripeAdapter --> StripeHttp
    StripeAdapter --> FakeStripe
    StripeHttp --> StripeAPI
    HttpAccount --> AuthSvc
```

### 6.2 Por qué Adapter (pagos)
El dominio no debe depender de Stripe: cambiar de pasarela, o correr sin una, no puede tocar los casos de uso. `IPaymentGateway` (**Target**) define lo que Wayvo necesita (crear, consultar y cancelar una suscripción, con reembolso opcional, y validar un webhook) en términos propios, con estados propios (`INCOMPLETE`, `ACTIVE`, `PAST_DUE`, `CANCELED`). `StripePaymentAdapter` (**Adapter**) traduce entre ese vocabulario y el de Stripe usando `StripeApi` (**Adaptee**), que tiene dos implementaciones intercambiables: `StripeHttpApi` (Stripe real) y `FakeStripeApi` (simulador para desarrollo, demos y pruebas). `PAYMENTS_MODE=real|mock` elige cuál se usa en el `container.ts`; el Adapter y todo lo que está encima son idénticos en los dos casos. Es el mismo patrón que `provider-service` aplica a vuelos y hoteles (sección 4), ahora en otro dominio.

### 6.3 Secuencia: activación de la suscripción (Saga con compensación)

```mermaid
sequenceDiagram
    autonumber
    actor V as Viajero (cliente web)
    participant GW as API Gateway
    participant Pay as payment-service
    participant Stripe as Stripe
    participant Auth as auth-service

    V->>GW: POST /api/v1/payments/subscriptions (Bearer JWT)
    GW->>Pay: x-user-id, x-user-email (del token)
    Pay->>Stripe: crea cliente y suscripción (estado incompleto)
    Stripe-->>Pay: subscription + clientSecret
    Pay-->>V: 201 {subscription, clientSecret}

    V->>Stripe: Payment Element: confirmPayment (la tarjeta va directo a Stripe)

    V->>GW: POST /api/v1/payments/subscriptions/{id}/activate
    GW->>Pay: ActivateSubscriptionUseCase
    Pay->>Stripe: consulta el estado del pago

    alt Pago no completado
        Pay-->>V: 402 PAYMENT_NOT_COMPLETED (la cuenta sigue FREE)
    else Pagado
        Pay->>Auth: PUT /api/v1/internal/users/{id}/plan {PREMIUM} (x-internal-token)
        alt La cuenta se actualiza
            Auth-->>Pay: 200
            Pay-->>V: 200 ACTIVATED (la cuenta es PREMIUM)
        else auth-service falla
            Note over Pay,Stripe: Compensación: se cobró pero la cuenta no cambió
            Pay->>Stripe: cancela la suscripción y reembolsa el último pago
            Pay-->>V: 409 SAGA_COMPENSATED (500 COMPENSATION_FAILED si el reembolso falla)
        end
    end
```

### 6.4 Webhooks de Stripe
Stripe avisa por su cuenta lo que pasa fuera de la app (renovación mensual, cobro fallido, cancelación desde el panel). `HandleWebhookUseCase` valida la firma (HMAC-SHA256 sobre `{timestamp}.{cuerpo}`, tolerancia de 300 s), sincroniza la suscripción con `customer.subscription.updated` y `customer.subscription.deleted`, y le ordena a `auth-service` subir o bajar el plan según la suscripción siga o no vigente. Una suscripción cancelada no vuelve a abrirse: un evento atrasado no la reactiva. El gateway reenvía este webhook **antes** de los parsers de cuerpo y sin exigir sesión, porque la firma se calcula sobre los bytes exactos.

### 6.5 Secuencia: cuota de planes de IA (FREE / PREMIUM)

```mermaid
sequenceDiagram
    autonumber
    actor V as Viajero (cliente web)
    participant GW as API Gateway (aiPlanQuotaMiddleware)
    participant Auth as auth-service
    participant AI as ai-recommendation

    V->>GW: POST /api/v1/trips/plan {budgetCategory, ...} (Bearer JWT)
    GW->>Auth: POST /internal/users/{id}/ai-plans/consume {budgetCategory}
    Note over Auth: PlanPolicy decide:<br/>FREE sin Lujo y con cupo del mes → descuenta 1 (UPDATE atómico)<br/>PREMIUM → permite sin contar

    alt Lujo en cuenta FREE, o sin planes este mes
        Auth-->>GW: allowed=false (LUXURY_BUDGET_REQUIRES_PREMIUM / AI_PLAN_LIMIT_REACHED)
        GW-->>V: 403 con los datos del aviso (usados, límite, renovación)
    else Permitido
        Auth-->>GW: allowed=true, counted=true/false
        GW->>AI: genera el plan
        alt La generación falla (respuesta ≥ 400)
            GW->>Auth: POST /internal/users/{id}/ai-plans/release {period}
            GW-->>V: error (el usuario no pierde el plan)
        else OK
            AI-->>GW: plan
            GW-->>V: 200 plan
        end
    end
    Note over GW,Auth: Si auth-service no responde, el gateway falla cerrado (503): no genera el plan.
```

---

## 7. Tabla Maestra de Mapeo Arquitectónico

| Patrón / mecanismo | Capa | Archivos clave | Responsabilidad |
| :--- | :--- | :--- | :--- |
| **Saga (orquestador)** | `application/saga` | [`saga-orchestrator.ts`](../../services/booking-service/src/application/saga/saga-orchestrator.ts) | Pasos hacia adelante, compensación en orden inverso y `CompensationLog`. |
| **Facade** | `application/facades` | [`trip.facade.ts`](../../services/api-gateway/src/application/facades/trip.facade.ts) | Unifica IA (plan) y Saga (checkout) en endpoints simples para el cliente. |
| **Adapter** | `adapters/external` | [`proveedor-externo.port.ts`](../../services/provider-service/src/application/ports/proveedor-externo.port.ts), [`transporte.adapter.ts`](../../services/provider-service/src/adapters/external/transporte.adapter.ts), [`alojamiento.adapter.ts`](../../services/provider-service/src/adapters/external/alojamiento.adapter.ts) | Traducen SerpAPI y Hotels API al puerto `IProveedorExterno`. |
| **Mediator** | `application/mediator` | [`IMediator.ts`](../../services/trip-service/src/application/mediator/IMediator.ts), [`TripMediator.ts`](../../services/trip-service/src/application/mediator/TripMediator.ts) | Coordina `EventService`, `AlternativeService` y `TripService` sin dependencias cruzadas. |
| **Autenticación JWT** | gateway `adapters/http/middlewares` + `auth-service` | [`auth.middleware.ts`](../../services/api-gateway/src/adapters/http/middlewares/auth.middleware.ts), [`jwt-token.service.ts`](../../services/auth-service/src/infrastructure/token/jwt-token.service.ts), [`register-user.use-case.ts`](../../services/auth-service/src/application/use-cases/register-user.use-case.ts) | Emisión y verificación de tokens, propagación de identidad, roles. |
| **Aislamiento por usuario** | trip / booking | [`identity.ts`](../../services/trip-service/src/adapters/middlewares/identity.ts), [`get-booking.use-case.ts`](../../services/booking-service/src/application/use-cases/get-booking.use-case.ts) | Cada usuario solo ve y modifica lo suyo (404 si es ajeno). |
| **Reserva atómica** | provider `infrastructure/persistence` | [`prisma-service-offer.repository.ts`](../../services/provider-service/src/infrastructure/persistence/prisma/prisma-service-offer.repository.ts), [`confirm-reservation.use-case.ts`](../../services/provider-service/src/application/use-cases/confirm-reservation.use-case.ts) | Evita vender dos veces el mismo cupo con usuarios concurrentes. |
| **Adapter (pagos)** | `adapters/payment` | [`payment-gateway.port.ts`](../../services/payment-service/src/application/ports/payment-gateway.port.ts), [`stripe.adapter.ts`](../../services/payment-service/src/adapters/payment/stripe.adapter.ts), [`stripe-api.ts`](../../services/payment-service/src/adapters/payment/stripe-api.ts) | Traducen Stripe (real o simulado) al puerto `IPaymentGateway`; `PAYMENTS_MODE` elige el *Adaptee*. |
| **Saga de activación** | `application/use-cases` | [`activate-subscription.use-case.ts`](../../services/payment-service/src/application/use-cases/activate-subscription.use-case.ts), [`cancel-subscription.use-case.ts`](../../services/payment-service/src/application/use-cases/cancel-subscription.use-case.ts) | Confirma el pago y cambia el plan de la cuenta; si falla, cancela y reembolsa. |
| **Webhooks firmados** | `infrastructure/stripe` | [`webhook-signature.ts`](../../services/payment-service/src/infrastructure/stripe/webhook-signature.ts), [`handle-webhook.use-case.ts`](../../services/payment-service/src/application/use-cases/handle-webhook.use-case.ts) | Valida la firma de Stripe y mantiene la cuenta al día en renovaciones y cancelaciones. |
| **Plan de cuenta y cuota de IA** | auth `domain/policies` + gateway `adapters/http/middlewares` | [`plan-policy.ts`](../../services/auth-service/src/domain/policies/plan-policy.ts), [`consume-ai-plan.use-case.ts`](../../services/auth-service/src/application/use-cases/consume-ai-plan.use-case.ts), [`prisma-ai-plan-usage.repository.ts`](../../services/auth-service/src/infrastructure/persistence/prisma/prisma-ai-plan-usage.repository.ts), [`ai-plan-quota.middleware.ts`](../../services/api-gateway/src/adapters/http/middlewares/ai-plan-quota.middleware.ts) | Límites FREE / PREMIUM aplicados en el servidor, con contador mensual atómico y devolución del plan si la generación falla. |
| **Rutas internas** | auth `adapters/http` | [`internal.routes.ts`](../../services/auth-service/src/adapters/http/routes/internal.routes.ts), [`internal-token.middleware.ts`](../../services/auth-service/src/adapters/http/middlewares/internal-token.middleware.ts) | Cambio de plan y cuota solo entre servicios, con token compartido; bloqueadas en el gateway. |
| **Compensación de cupos** | provider `application/use-cases` | [`release-reservation.use-case.ts`](../../services/provider-service/src/application/use-cases/release-reservation.use-case.ts) | Devuelve los cupos cuando la Saga de reservas compensa (`COMPENSATE_PROVIDER`). |
