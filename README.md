# WAYVO MVP - Plataforma Inteligente de Viajes

> **Sistema Multi-Plataforma con Arquitectura de Microservicios, Clean Architecture, 4 Patrones GoF/Arquitectónicos y Motor Multiagente LangGraph en Python**

---

## Índice de Contenidos
1. [Visión General y Objetivos del MVP](#visión-general-y-objetivos-del-mvp)
2. [Equipo de Proyecto y Asignación de Roles](#equipo-de-proyecto-y-asignación-de-roles)
3. [Tabla Maestra de Patrones Implementados](#tabla-maestra-de-patrones-implementados)
4. [Documentación Técnica Detallada (Diagramas C4)](#documentación-técnica-detallada-diagramas-c4)
5. [Arquitectura de Microservicios y Topología de Red](#arquitectura-de-microservicios-y-topología-de-red)
6. [Estructura de Capas Clean Architecture](#estructura-de-capas-clean-architecture)
7. [Catálogo de Microservicios y Endpoints REST](#catálogo-de-microservicios-y-endpoints-rest)
8. [Guía Paso a Paso de Ejecución con Docker Compose](#guía-paso-a-paso-de-ejecución-con-docker-compose)
9. [Pruebas de Integración y Demostración de Resiliencia](#pruebas-de-integración-y-demostración-de-resiliencia)
10. [Manejo Centralizado de Errores y Trazabilidad (Req. 8.18)](#manejo-centralizado-de-errores-y-trazabilidad-req-818)

---

## Visión General y Objetivos del MVP

**Wayvo** es una plataforma multiplataforma (Web y Móvil) diseñada para optimizar la planificación, reserva y gestión dinámica de viajes:
- **Planificación Hiperpersonalizada:** Cuestionario de perfilamiento psicológico procesado por un grafo de agentes inteligentes en **LangGraph** (Python) que evalúa personalidad, presupuesto, conexiones de transporte y actividades locales.
- **Transacciones Distribuidas Resilientes:** Coordinación de reservas y proveedores mediante el patrón **Saga (Orquestador)**, garantizando consistencia eventual y rollback compensatorio automático ante fallas de proveedores externos.
- **Gestión Dinámica en Ruta:** Aplicación interactiva que permite al viajero marcar el avance de su itinerario en tiempo real, reportar eventualidades (vuelos cancelados, mal tiempo) y recibir planes alternativos inteligentes mediante el patrón **Mediator**.
- **Aislamiento de Terceros:** Normalización de APIs heterogéneas de aerolíneas y hoteles a través del patrón **Adapter**.
- **Punto Único de Entrada y Desacoplamiento:** API Gateway con el patrón **Facade** que simplifica la interacción del cliente frontend y centraliza el manejo de excepciones.

---

## Equipo de Proyecto y Asignación de Roles

| Desarrollador | Módulos Asignados | Patrón Asignado (Tipo) | Foco de la Defensa Técnica |
| :--- | :--- | :--- | :--- |
| **Dev 1 (Joshua Lobo)** | `services/booking-service` + Orquestador Saga | **Saga (Orquestador)** *(Arquitectónico)* | Transacciones distribuidas sin 2PC, consistencia eventual, secuencia de rollback compensatorio y registro en `CompensationLog`. |
| **Dev 2 (Alexy Salcedo)** | `services/api-gateway` + `apps/client` (Web & Mobile) | **Facade** *(Estructural GoF)* | Desacoplamiento del cliente respecto a microservicios internos, reducción de chatty network I/O, prevención de God Object y middleware centralizado de errores (8.18). |
| **Dev 3 (Kesly Rodríguez)** | `services/provider-service` + Mocks APIs | **Adapter** *(Estructural GoF)* | Normalización de APIs heterogéneas de terceros (vuelos, hoteles) al modelo interno `IProveedorExterno` y simulador de caos para fallos controlados. |
| **Dev 4 (Santiago Vengoechea)** | `services/trip-service` + `services/ai-recommendation` | **Mediator** *(Comportamiento GoF)* | Desacoplamiento de eventos e incidencias de viaje (`EventService`, `AlternativeService`, `TripService`) y flujo multiagente en LangGraph. |

---

## Tabla Maestra de Patrones Implementados

| Patrón | Clasificación | Microservicio | Ubicación Exacta de Archivos Clave | Responsabilidad en el Sistema |
| :--- | :--- | :--- | :--- | :--- |
| **Saga** | Arquitectónico (Transaccional) | `booking-service` | [`saga-orchestrator.ts`](file:///Users/alexy/Documents/Uninorte/Octavo%20Semestre/Disen%CC%83o%202/Wayvo/services/booking-service/src/application/saga/saga-orchestrator.ts)<br/>[`compensation-log.entity.ts`](file:///Users/alexy/Documents/Uninorte/Octavo%20Semestre/Disen%CC%83o%202/Wayvo/services/booking-service/src/domain/entities/compensation-log.entity.ts) | Orquesta los pasos hacia adelante (crear viaje -> crear reserva -> validar proveedor). Si el proveedor falla, ejecuta compensación automática cancelando reserva y viaje. |
| **Facade** | Estructural (GoF) | `api-gateway` | [`trip.facade.ts`](file:///Users/alexy/Documents/Uninorte/Octavo%20Semestre/Disen%CC%83o%202/Wayvo/services/api-gateway/src/application/facades/trip.facade.ts)<br/>[`trip-facade.controller.ts`](file:///Users/alexy/Documents/Uninorte/Octavo%20Semestre/Disen%CC%83o%202/Wayvo/services/api-gateway/src/adapters/http/controllers/trip-facade.controller.ts) | Proporciona endpoints de alto nivel (`/api/v1/trips/plan`, `/api/v1/trips/checkout`), agregando llamadas internas a la IA y la Saga para evitar que el cliente haga múltiples peticiones. |
| **Adapter** | Estructural (GoF) | `provider-service` | [`proveedor-externo.port.ts`](file:///Users/alexy/Documents/Uninorte/Octavo%20Semestre/Disen%CC%83o%202/Wayvo/services/provider-service/src/application/ports/proveedor-externo.port.ts)<br/>[`transporte.adapter.ts`](file:///Users/alexy/Documents/Uninorte/Octavo%20Semestre/Disen%CC%83o%202/Wayvo/services/provider-service/src/adapters/external/transporte.adapter.ts)<br/>[`alojamiento.adapter.ts`](file:///Users/alexy/Documents/Uninorte/Octavo%20Semestre/Disen%CC%83o%202/Wayvo/services/provider-service/src/adapters/external/alojamiento.adapter.ts) | Adapta interfaces dispares de APIs externas (SerpAPI Flights, Hotels API) al puerto canónico `IProveedorExterno`. Permite cambiar de proveedor sin tocar la lógica de negocio. |
| **Mediator** | Comportamiento (GoF) | `trip-service` | [`TripMediator.ts`](file:///Users/alexy/Documents/Uninorte/Octavo%20Semestre/Disen%CC%83o%202/Wayvo/services/trip-service/src/application/mediator/TripMediator.ts)<br/>[`IMediator.ts`](file:///Users/alexy/Documents/Uninorte/Octavo%20Semestre/Disen%CC%83o%202/Wayvo/services/trip-service/src/application/mediator/IMediator.ts) | Coordina las interacciones entre `EventService` (registra novedades), `AlternativeService` (solicita opciones a la IA) y `TripService` (actualiza el itinerario), garantizando cero acoplamiento directo entre ellos. |

---

## Documentación Técnica Detallada (Diagramas C4)

Cada diagrama de arquitectura se encuentra estructurado en su archivo independiente:

| Documento | Ubicación | Descripción |
| :--- | :--- | :--- |
| **C4 Nivel 1: Contexto del Sistema** | [`docs/c4/c4-level1-context.md`](file:///Users/alexy/Documents/Uninorte/Octavo%20Semestre/Disen%CC%83o%202/Wayvo/docs/c4/c4-level1-context.md) | Diagrama de contexto del sistema, actores (Viajero y Administrador/Dev), sistemas externos (APIs de transporte, alojamiento y modelos de lenguaje) y flujos de valor. |
| **C4 Nivel 2: Contenedores** | [`docs/c4/c4-level2-containers.md`](file:///Users/alexy/Documents/Uninorte/Octavo%20Semestre/Disen%CC%83o%202/Wayvo/docs/c4/c4-level2-containers.md) | Topología de contenedores, puertos de red, bases de datos independientes (**Database-per-Service**) y protocolos de comunicación HTTP/REST. |
| **C4 Nivel 3: Componentes y Clean Architecture** | [`docs/c4/c4-level3-components.md`](file:///Users/alexy/Documents/Uninorte/Octavo%20Semestre/Disen%CC%83o%202/Wayvo/docs/c4/c4-level3-components.md) | Desglose en capas (Domain, Application, Adapters, Infrastructure) y diagramas de secuencia para Booking (Saga), Provider (Adapter) y Trip (Mediator). |

---

## Arquitectura de Microservicios y Topología de Red

```text
wayvo-monorepo/
├── apps/
│   └── client/                 # React + Vite (Web y Responsive Móvil) [Puerto 5173]
├── services/
│   ├── api-gateway/            # Express / Node.js [Puerto 3000] -> Patrón Facade
│   ├── booking-service/        # Node.js + TypeScript [Puerto 3001] -> Patrón Saga
│   ├── provider-service/       # Node.js + TypeScript [Puerto 3002] -> Patrón Adapter
│   ├── trip-service/           # Node.js + TypeScript [Puerto 3003] -> Patrón Mediator
│   └── ai-recommendation/      # Python + FastAPI + LangGraph [Puerto 8000]
├── shared/
│   └── contracts/              # @wayvo/contracts: DTOs Zod y esquemas JSON comunes
├── docs/                       # Documentación técnica de arquitectura
│   └── c4/                     # Archivos de diagramas C4 Nivel 1, 2 y 3
├── docker-compose.yml          # Orquestación de contenedores y bases de datos
├── package.json                # Workspaces de npm y scripts globales
└── README.md                   # Documentación raíz del proyecto
```

### Mapeo de Puertos y Bases de Datos (Database-per-Service)

| Servicio / Contenedor | Lenguaje / Framework | Puerto Host | Puerto Contenedor | Base de Datos Asociada |
| :--- | :--- | :--- | :--- | :--- |
| **`client`** | React 18 / TypeScript / Vite | `5173` | `80` (o `5173`) | N/A (Frontend SPA) |
| **`api-gateway`** | Node.js / Express | `3000` | `3000` | N/A (Stateless / Reverse Proxy) |
| **`booking-service`** | Node.js / TypeScript | `3001` | `3001` | PostgreSQL `booking_db` (`5433:5432`) |
| **`provider-service`**| Node.js / TypeScript | `3002` | `3002` | PostgreSQL `provider_db` (`5434:5432`) |
| **`trip-service`**    | Node.js / TypeScript | `3003` | `3003` | PostgreSQL `trip_db` (`5435:5432`) |
| **`ai-recommendation`**| Python 3.11 / FastAPI | `8000` | `8000` | In-Memory Graph / Vector Store |

---

## Estructura de Capas Clean Architecture

Cada microservicio implementa la separación estricta en 4 capas concéntricas:

```text
service/
├── src/
│   ├── domain/           # Capa de Dominio (Entidades puras, Value Objects, Enums de estado, Reglas de negocio)
│   ├── application/      # Capa de Aplicación (Casos de uso, Puertos/Interfaces, Orquestadores/Mediadores)
│   ├── adapters/         # Capa de Adaptadores (Controladores HTTP, Presentadores, Adaptadores externos, Gateways)
│   └── infrastructure/   # Capa de Infraestructura (TypeORM, Conexiones a bases de datos, Express, Logs)
```

- **Dominio:** Contiene entidades como `Trip`, `Booking`, `Provider`, independientes de cualquier framework.
- **Aplicación:** Implementa los casos de uso del negocio interactuando con el exterior únicamente a través de **Puertos** (`ports`).
- **Adaptadores:** Convierten los datos del formato externo (HTTP, JSON) al formato de la aplicación y viceversa.
- **Infraestructura:** Concreta los detalles técnicos (motores SQL, llamadas `fetch`, clientes de red).

---

## Catálogo de Microservicios y Endpoints REST

### 1. API Gateway (Puerto 3000)
- `POST /api/v1/trips/plan`: Agregación de fachada para disparar el motor multiagente y retornar una propuesta estructurada.
- `POST /api/v1/trips/checkout`: Agregación de fachada que dispara la transacción distribuida Saga en `booking-service`.
- `GET /health`: Health-check consolidado del Gateway y verificación de conectividad con todos los microservicios.
- `ALL /api/v1/*`: Proxy inverso dinámico hacia los microservicios internos.

### 2. Booking Service (Puerto 3001)
- `POST /api/v1/saga/confirm-trip`: Ejecuta la orquestación Saga hacia adelante y coordina el rollback si falla.
- `GET /api/v1/saga/:correlationId/compensation-log`: Consulta la auditoría de compensaciones de una transacción específica.
- `POST /api/v1/bookings`: Crea una reserva local en estado `PENDING`.
- `POST /api/v1/bookings/:id/cancel`: Caso de uso de compensación para marcar reserva como `CANCELLED`.

### 3. Provider Service (Puerto 3002)
- `POST /api/v1/providers/check-availability`: Consulta estandarizada a través de adaptadores (`TransporteAdapter`, `AlojamientoAdapter`).
- `POST /api/v1/providers/confirm`: Confirma el bloqueo de cupos con el proveedor externo.
- `GET /api/v1/mock/simulate-failure?mode=unavailable`: Interruptor de simulación de fallos para probar la resiliencia de la Saga.
- `GET /api/v1/mock/simulate-failure?mode=normal`: Restaura el funcionamiento normal del simulador.

### 4. Trip Service (Puerto 3003)
- `POST /api/v1/trips`: Crea un nuevo viaje en estado `DRAFT` o `PENDING`.
- `GET /api/v1/trips`: Lista todos los viajes registrados.
- `GET /api/v1/trips/:id`: Obtiene el detalle completo del viaje, itinerario y eventos diarios.
- `DELETE /api/v1/trips/:id`: Elimina permanentemente un viaje de la base de datos.
- `POST /api/v1/trips/:id/incidents`: Reporta un imprevisto y delega a `TripMediator` para obtener alternativas inteligentes.
- `POST /api/v1/trips/:id/resolve-incident`: Cancela el evento original e inyecta la alternativa seleccionada.
- `PATCH /api/v1/trips/:id/events/:eventId/status`: Actualiza el estado del evento (`CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).

### 5. AI Recommendation Service (Puerto 8000)
- `POST /api/v1/recommend/plan`: Ejecuta el grafo de estados de LangGraph y genera el desglose de viaje.
- `POST /api/v1/recommend/incident-resolution`: Agente de incidencias que propone 3 soluciones viables y contextuales.
- `POST /api/v1/chat`: Chat contextual con el agente turístico.

---

## Guía Paso a Paso de Ejecución con Docker Compose

### Prerrequisitos
- **Docker** y **Docker Compose** instalados (Docker Desktop en Mac/Windows o Docker Engine en Linux).
- Node.js 18+ (opcional, solo si se desea correr fuera de contenedores).

### 1. Clonar el repositorio y configurar variables de entorno
```bash
cp .env.example .env
```

### 2. Construir y levantar todos los servicios con Docker Compose
```bash
# Levantar bases de datos, microservicios backend y API gateway en background
docker compose up --build -d

# Si se desea incluir también el cliente frontend en contenedor:
docker compose --profile client up --build -d
```

### 3. Verificar que los contenedores estén saludables
```bash
docker compose ps
```
Debe visualizar los siguientes contenedores en ejecución:
- `wayvo-api-gateway`
- `wayvo-booking-service`
- `wayvo-provider-service`
- `wayvo-trip-service`
- `wayvo-ai-recommendation`
- `wayvo-booking-db`
- `wayvo-provider-db`
- `wayvo-trip-db`

### 4. Ejecución en Modo Desarrollo Local (Bases de datos en Docker, servicios en terminal)
```bash
# 1. Levantar únicamente las bases de datos
docker compose up -d booking_db provider_db trip_db

# 2. Instalar dependencias globales del monorepo
npm install

# 3. Compilar los contratos compartidos
npm run build:contracts

# 4. Levantar los servicios en terminales separadas
npm run dev:gateway      # Puerto 3000
npm run dev:booking      # Puerto 3001
npm run dev:provider     # Puerto 3002
npm run dev:trip         # Puerto 3003
npm run dev:client       # Puerto 5173
```

---

## Pruebas de Integración y Demostración de Resiliencia

### Prueba 1: Flujo Normal de Integración End-to-End
1. Abrir el navegador en `http://localhost:5173`.
2. Completar el cuestionario de onboarding psicológico (ej. Destino: "Santa Marta", Estilo: "Aventura", Presupuesto: "Estándar").
3. Hacer clic en **"Generar Propuesta con IA"**.
   - Flujo: Frontend -> Gateway (`POST /trips/plan`) -> AI LangGraph (:8000) -> Propuesta generada con desglose de transporte, hotel y actividades.
4. En la pantalla de propuesta, hacer clic en **"Confirmar Viaje"**.
   - Flujo: Gateway -> Booking Service (`POST /saga/confirm-trip`) -> Trip Service (Crear viaje `PENDING`) -> Booking Service (Crear reserva `PENDING`) -> Provider Service (Verificar cupos) -> Todos exitosos -> Estado final: `CONFIRMED`.
5. El usuario es redirigido al panel de **Mis Viajes** y al **Itinerario Activo**.

### Prueba 2: Prueba de Resiliencia y Rollback Automático de la Saga
1. **Activar la simulación de indisponibilidad en el proveedor:**
   ```bash
   curl http://localhost:3002/api/v1/mock/simulate-failure?mode=unavailable
   ```
2. Intentar confirmar un viaje desde la interfaz o vía curl:
   ```bash
   curl -X POST http://localhost:3000/api/v1/trips/checkout \
     -H "Content-Type: application/json" \
     -d '{"tripData": {"destination": "Cartagena", "totalBudget": 1500000}}'
   ```
3. **Comportamiento esperado:**
   - La terminal de `booking-service` detecta el fallo del proveedor en el paso 3.
   - Se activa la **secuencia de compensación automática**:
     - La reserva local se marca como `CANCELLED`.
     - El viaje en `trip-service` se actualiza a `CANCELLED`.
     - Se registra la traza en `CompensationLog`.
   - La interfaz muestra un mensaje claro indicando que los proveedores no tienen disponibilidad y que no se generaron registros huérfanos.
4. **Restaurar el proveedor a modo normal:**
   ```bash
   curl http://localhost:3002/api/v1/mock/simulate-failure?mode=normal
   ```

---

## Manejo Centralizado de Errores y Trazabilidad (Req. 8.18)

### 1. Formato Homogéneo de Respuesta de Excepciones
Toda falla en la plataforma es interceptada por el middleware centralizado (`error.middleware.ts`) del API Gateway, devolviendo siempre una estructura uniforme:

```json
{
  "success": false,
  "error": {
    "code": "EXTERNAL_PROVIDER_UNAVAILABLE",
    "message": "Los proveedores externos de transporte no tienen cupos disponibles.",
    "details": {
      "failedService": "provider-service",
      "correlationId": "wayvo-cor-78a9c-2026"
    }
  }
}
```

### 2. Trazabilidad con `x-correlation-id`
Cada solicitud entrante recibe o propaga el encabezado HTTP `x-correlation-id`. Este identificador:
- Se registra con timestamp ISO en los registros de consola de cada microservicio.
- Se adjunta a cada entrada de la tabla `CompensationLog`.
- Permite auditar el ciclo de vida completo de cualquier transacción con el **DevInspector HUD** integrado en la aplicación cliente.
