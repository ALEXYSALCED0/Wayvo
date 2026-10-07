# 🚀 WAYVO MVP - Monorepo de Microservicios

Plataforma inteligente de planificación, reservas y gestión dinámica de viajes construida bajo arquitectura de **Microservicios**, **Clean Architecture**, **4 Patrones de Diseño/Arquitectónicos GoF** y **Motor Multiagente LangGraph en Python**.

---

## 👥 Equipo del Proyecto y Asignación de Módulos

| Desarrollador | Módulos Asignados | Patrón Asignado | Rol y Foco Técnico |
| :--- | :--- | :--- | :--- |
| **Dev 1 (Joshua)** | `services/booking-service` + Orquestador | **Saga (Orquestación)** *(Arquitectónico)* | Transacciones distribuidas, consistencia eventual y rollback compensatorio automático. |
| **Dev 2 (Alexy)** | `services/api-gateway` + `apps/client` | **Facade** *(Estructural GoF)* | Punto único de entrada, desacoplamiento del cliente, agregación de endpoints y manejo de errores. |
| **Dev 3 (Kesly)** | `services/provider-service` + Mocks APIs | **Adapter** *(Estructural GoF)* | Normalización de APIs heterogéneas externas (vuelos, hoteles) y simulación de fallos. |
| **Dev 4 (Santiago)** | `services/trip-service` + `services/ai-recommendation` | **Mediator** *(Comportamiento GoF)* | Desacoplamiento entre eventos, recálculos de itinerario e incidencias; orquestación multiagente. |

---

## 📂 Arquitectura de Carpetas y Puertos

```text
wayvo-monorepo/
├── apps/
│   └── client/                 # React Native / Expo (Web y Móvil) [Puertos 8081 / 19006]
├── services/
│   ├── api-gateway/            # Express / Node.js [Puerto 3000] -> Patrón Facade
│   ├── booking-service/        # Node.js + TypeScript [Puerto 3001] -> Patrón Saga
│   ├── provider-service/       # Node.js + TypeScript [Puerto 3002] -> Patrón Adapter
│   ├── trip-service/           # Node.js + TypeScript [Puerto 3003] -> Patrón Mediator
│   └── ai-recommendation/      # Python + FastAPI + LangGraph [Puerto 8000]
├── shared/
│   └── contracts/              # @wayvo/contracts: DTOs, Zod y JSON Schemas compartidos
├── docker-compose.yml          # Orquestación de contenedores, bases de datos y red
├── pnpm-workspace.yaml         # Soporte nativo de workspaces para pnpm
├── package.json                # Workspaces de npm/yarn y scripts globales
└── README.md                   # Documentación técnica raíz y guía de inicio
```

---

## 🌐 Mapeo de Puertos y Bases de Datos

| Servicio / Contenedor | Tecnología | Puerto Host | Base de Datos Asociada |
| :--- | :--- | :--- | :--- |
| **`api-gateway`** | Node.js / Express | `3000` | N/A (Stateless / Reverse Proxy) |
| **`booking-service`** | Node.js / TypeScript | `3001` | PostgreSQL `booking_db` (`5433:5432`) |
| **`provider-service`**| Node.js / TypeScript | `3002` | PostgreSQL `provider_db` (`5434:5432`) |
| **`trip-service`**    | Node.js / TypeScript | `3003` | PostgreSQL `trip_db` (`5435:5432`) |
| **`ai-recommendation`**| Python / FastAPI | `8000` | Vector Store / Stateless Agent Graph |
| **`client`**          | Expo React Native Web | `8081` / `19006` | N/A (Frontend Client) |

---

## 📦 Gestión de Workspaces (npm / pnpm / yarn)

El monorepo está configurado para permitir instalación y resolución de dependencias transparente con:
- **npm / yarn:** Vía `"workspaces": ["apps/*", "services/*", "shared/*"]` en `package.json`.
- **pnpm:** Vía `pnpm-workspace.yaml`.

### Scripts Principales en la Raíz

```bash
# 1. Compilar y probar contratos compartidos
npm run build:contracts
npm run test:contracts

# 2. Compilar todos los paquetes del monorepo
npm run build

# 3. Levantar servicios individuales en desarrollo local
npm run dev:gateway      # Puerto 3000
npm run dev:booking      # Puerto 3001
npm run dev:provider     # Puerto 3002
npm run dev:trip         # Puerto 3003
npm run dev:client       # Expo Web / Metro
```

---

## 🐳 Orquestación con Docker Compose

Para levantar toda la plataforma (bases de datos de microservicios, backend y gateway):

```bash
# Copiar variables de entorno base si no existen
cp .env.example .env

# Construir y levantar todos los servicios en background
docker compose up --build -d

# Ver logs unificados
docker compose logs -f

# Detener todos los contenedores y redes
docker compose down
```

### Incluir el Cliente Frontend en Docker:
```bash
docker compose --profile client up --build
```

---

## 🧱 Plantilla de Clean Architecture por Microservicio

Cada microservicio desacoplado sigue la estructura de 4 capas de **Clean Architecture**:

```text
service/
├── src/
│   ├── domain/           # Entidades puras, Value Objects, Errores y Repositorios
│   ├── application/      # Casos de uso, DTOs y Puertos (Interfaces)
│   ├── adapters/         # Controladores HTTP, Presentadores y Gateways hacia otros servicios
│   └── infrastructure/   # Bases de datos (Prisma/TypeORM), Logs y Configuración
```

---

## 📜 Contratos Compartidos (`@wayvo/contracts`)

Ubicados en `shared/contracts`, centralizan:
1. **Viajes (`trips`):** Entidades `Trip`, `Event`, `Itinerary`, `DayPlan`, incidencias y alternativas.
2. **Reservas (`bookings`):** Entidades `Booking`, `BookingItem`, orquestación de la Saga y `CompensationLog`.
3. **Perfiles (`profiles`):** Onboarding psicológico, preferencias y salidas de los agentes LangGraph.
4. **Proveedores (`providers`):** Target `IProveedorExterno`, adaptadores y modo mock de fallos.
5. **Común (`common`):** Formato uniforme de respuestas `{ success, data, error }` (Requisito 8.18) y header `x-correlation-id`.
