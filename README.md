# WAYVO - Plataforma Inteligente de Viajes

> **Plataforma multiusuario de microservicios con Clean Architecture, 4 patrones (Saga, Facade, Adapter, Mediator), motor multiagente LangGraph en Python, autenticación JWT y suscripción con Stripe.**

---

## Índice
1. [Visión general](#visión-general)
2. [Equipo](#equipo)
3. [Patrones implementados](#patrones-implementados)
4. [Multiusuario y seguridad](#multiusuario-y-seguridad)
5. [Pagos y planes de cuenta (Stripe)](#pagos-y-planes-de-cuenta-stripe)
6. [Documentación de arquitectura (C4)](#documentación-de-arquitectura-c4)
7. [Microservicios, puertos y bases de datos](#microservicios-puertos-y-bases-de-datos)
8. [Clean Architecture](#clean-architecture)
9. [Catálogo de endpoints](#catálogo-de-endpoints)
10. [Configuración (.env)](#configuración-env)
11. [Ejecución con Docker Compose](#ejecución-con-docker-compose)
12. [Pruebas automatizadas](#pruebas-automatizadas)
13. [Guion de demostración](#guion-de-demostración)
14. [Manejo centralizado de errores y trazabilidad (Req. 8.18)](#manejo-centralizado-de-errores-y-trazabilidad-req-818)

---

## Visión general

**Wayvo** es una plataforma web responsive para planificar, reservar y gestionar viajes:

- **Multiusuario:** cada viajero tiene su cuenta (registro e inicio de sesión con JWT). Sus viajes y reservas son privados.
- **Planificación con IA:** un grafo de agentes en **LangGraph** (Python + Gemini) analiza el perfil del viajero y arma transporte, alojamiento, actividades, comida y presupuesto.
- **Reservas consistentes:** la confirmación del viaje es una transacción distribuida con el patrón **Saga**, con compensación automática si un proveedor falla.
- **Cupos sin sobreventa:** la reserva de cupos es atómica; con usuarios concurrentes, nunca se vende dos veces el mismo cupo.
- **Itinerario vivo:** el viajero reporta imprevistos y recibe alternativas coordinadas por el patrón **Mediator**.
- **Integración con terceros:** APIs de vuelos y hoteles normalizadas con el patrón **Adapter**.
- **Punto único de entrada:** API Gateway con el patrón **Facade**, autenticación y manejo centralizado de errores.
- **Suscripción con Stripe:** un único plan de pago (USD 4.95 al mes). La cuenta **FREE** genera hasta 5 planes de IA por mes y no accede al presupuesto Lujo; **PREMIUM** no tiene límite y accede a todos los presupuestos. Planificar y calcular el presupuesto es gratis y reservar no requiere pago en Wayvo (ver [Pagos y planes de cuenta](#pagos-y-planes-de-cuenta-stripe)).

---

## Equipo

### Entrega final

| Integrante | Responsabilidades |
| :--- | :--- |
| **Santiago Vengoechea** | `trip-service` (Mediator), `ai-recommendation` (LangGraph). Multiusuario: `auth-service`, autenticación JWT en el gateway, aislamiento de datos por usuario y login en el cliente. Persistencia de `trip-service` en PostgreSQL y reserva atómica de cupos. |
| **Kesly Rodríguez** | `provider-service` (Adapter). `payment-service`: suscripción PREMIUM con Stripe (Adapter de pagos y Saga de activación), liberación de cupos y límites de plan. |

### Primera entrega (créditos)

| Integrante | Módulos | Patrón |
| :--- | :--- | :--- |
| **Joshua Lobo** | `services/booking-service` | **Saga** (orquestador) |
| **Alexy Salcedo** | `services/api-gateway`, `apps/client`, `shared/contracts` | **Facade** |
| **Kesly Rodríguez** | `services/provider-service` + mocks de APIs externas | **Adapter** |
| **Santiago Vengoechea** | `services/trip-service`, `services/ai-recommendation` | **Mediator** + LangGraph |

### Estado de la entrega final

| Requisito | Estado |
| :--- | :--- |
| Multiusuario (registro, login, JWT, aislamiento por usuario, roles) | ✅ Implementado |
| Concurrencia en reservas (cupos atómicos) | ✅ Implementado |
| Persistencia de `trip-service` en PostgreSQL | ✅ Implementado |
| Pasarela de pagos con Stripe (suscripción PREMIUM) | ✅ Implementado |
| Planes FREE / PREMIUM con límites aplicados en el servidor | ✅ Implementado |
| Liberación de cupos al compensar la Saga | ✅ Implementado |

---

## Patrones implementados

| Patrón | Tipo | Servicio | Archivos clave | Responsabilidad |
| :--- | :--- | :--- | :--- | :--- |
| **Saga** | Arquitectónico | `booking-service` | [`saga-orchestrator.ts`](services/booking-service/src/application/saga/saga-orchestrator.ts), [`compensation-log.ts`](services/booking-service/src/domain/entities/compensation-log.ts) | Orquesta crear viaje → crear reserva → reservar con proveedores → confirmar. Si algo falla, compensa en orden inverso (incluida la **liberación de cupos** en `provider-service`) y registra `CompensationLog`. |
| **Facade** | Estructural (GoF) | `api-gateway` | [`trip.facade.ts`](services/api-gateway/src/application/facades/trip.facade.ts), [`trip-facade.controller.ts`](services/api-gateway/src/adapters/http/controllers/trip-facade.controller.ts) | Endpoints de alto nivel (`/trips/plan`, `/trips/checkout`) que ocultan la IA y la Saga al cliente. |
| **Adapter** | Estructural (GoF) | `provider-service` | [`proveedor-externo.port.ts`](services/provider-service/src/application/ports/proveedor-externo.port.ts), [`transporte.adapter.ts`](services/provider-service/src/adapters/external/transporte.adapter.ts), [`alojamiento.adapter.ts`](services/provider-service/src/adapters/external/alojamiento.adapter.ts) | Adapta SerpAPI (vuelos) y Hotels API al puerto `IProveedorExterno`. |
| **Adapter** (pagos) | Estructural (GoF) | `payment-service` | [`payment-gateway.port.ts`](services/payment-service/src/application/ports/payment-gateway.port.ts), [`stripe.adapter.ts`](services/payment-service/src/adapters/payment/stripe.adapter.ts), [`stripe-api.ts`](services/payment-service/src/adapters/payment/stripe-api.ts) | Adapta Stripe al puerto `IPaymentGateway`. El *Adaptee* `StripeApi` tiene dos implementaciones: Stripe real y un simulador (`PAYMENTS_MODE`). |
| **Saga de activación** | Arquitectónico | `payment-service` | [`activate-subscription.use-case.ts`](services/payment-service/src/application/use-cases/activate-subscription.use-case.ts), [`cancel-subscription.use-case.ts`](services/payment-service/src/application/use-cases/cancel-subscription.use-case.ts) | Confirma el pago y pasa la cuenta a PREMIUM. Si se cobró pero la cuenta no se pudo actualizar, compensa cancelando la suscripción y reembolsando. |
| **Mediator** | Comportamiento (GoF) | `trip-service` | [`IMediator.ts`](services/trip-service/src/application/mediator/IMediator.ts), [`TripMediator.ts`](services/trip-service/src/application/mediator/TripMediator.ts) | Coordina `EventService`, `AlternativeService` y `TripService` ante incidencias, sin que se conozcan entre sí. |

El motor de IA está en [`graph.py`](services/ai-recommendation/application/graph.py) (`StateGraph` de LangGraph).

---

## Multiusuario y seguridad

```text
Cliente ──(Bearer JWT)──► API Gateway ──(x-user-id)──► trip / booking / provider / ai
   ▲                         │ verifica firma del JWT
   └──── token ◄── auth-service (registro / login, bcrypt + JWT)
```

- **`auth-service`** registra usuarios (contraseña guardada como hash **bcrypt**) y emite **JWT** firmados con `JWT_SECRET`.
- El **API Gateway** verifica el JWT en cada petición (sin llamar a `auth-service`), borra cualquier `x-user-id` enviado por el cliente y propaga el verdadero. Sin token válido responde **401**.
- **Aislamiento:** `trip-service` y `booking-service` solo devuelven y modifican recursos del usuario; lo ajeno responde **404**.
- **Roles:** `TRAVELER` por defecto; los correos en `ADMIN_EMAILS` reciben `ADMIN` al registrarse. El modo Dev y el simulador de fallos (`/api/v1/mock/*`) son solo para `ADMIN` (**403** para el resto).
- **Concurrencia:** los cupos se apartan con un `UPDATE` atómico en PostgreSQL ([`prisma-service-offer.repository.ts`](services/provider-service/src/infrastructure/persistence/prisma/prisma-service-offer.repository.ts)).

Archivos clave: [`auth.middleware.ts`](services/api-gateway/src/adapters/http/middlewares/auth.middleware.ts), [`auth-service`](services/auth-service/src), [`identity.ts`](services/trip-service/src/adapters/middlewares/identity.ts), [`AuthContext.tsx`](apps/client/src/context/AuthContext.tsx).

---

## Pagos y planes de cuenta (Stripe)

Wayvo tiene **un solo pago: la suscripción mensual PREMIUM (USD 4.95)**, este plan queda registrado en el estado de la cuenta (`auth-service`).

| | FREE | PREMIUM |
| :--- | :--- | :--- |
| Planes generados por IA | **5 por mes calendario** (zona `America/Bogota`) | Ilimitados |
| Presupuestos | Económico, Estándar y Personalizado | Todos, incluido **Lujo** |
| Costo | $0 | USD 4.95 / mes |

```text
Cliente (Payment Element) ──► API Gateway ──► payment-service ──► Stripe
                                   │                 │
                                   │                 └─ PUT plan (token interno) ─► auth-service
                                   └─ cuota de planes de IA ─────────────────────► auth-service
Stripe ── webhook (firma) ──► API Gateway ──► payment-service ──► auth-service
```

- **Adapter de pagos:** el dominio solo conoce `IPaymentGateway`; `StripePaymentAdapter` traduce entre los estados de Wayvo (`INCOMPLETE`, `ACTIVE`, `PAST_DUE`, `CANCELED`) y los de Stripe. Con `PAYMENTS_MODE=mock` se usa un simulador (sin claves ni cobros); con `real`, Stripe en modo de prueba.
- **Saga de activación:** `POST /subscriptions/:id/activate` confirma el pago y cambia el plan de la cuenta. Si se cobró pero la cuenta falla, **compensa** cancelando la suscripción y reembolsando. Respuestas: `200` activada, `402` pago no completado, `409` compensada, `500` compensación fallida (reembolso manual).
- **Webhooks:** `customer.subscription.updated` y `customer.subscription.deleted` mantienen la cuenta al día en renovaciones, cobros fallidos y cancelaciones hechas desde Stripe. La firma (HMAC-SHA256) se valida sobre el cuerpo exacto, por eso el gateway lo reenvía sin reescribirlo.
- **Límites en el servidor:** `auth-service` es dueño de las reglas (`PlanPolicy`) y del contador mensual (`ai_plan_usage`, una fila por usuario y mes, con `UPDATE` atómico). El gateway pregunta antes de generar un plan en `POST /trips/plan` y en `POST /ai/plan`: responde **403** (`AI_PLAN_LIMIT_REACHED` o `LUXURY_BUDGET_REQUIRES_PREMIUM`), devuelve el plan si la generación falla y **falla cerrado** (503) si no puede comprobar la cuenta.
- **Seguridad:** el navegador nunca cambia su propio plan; solo `payment-service`, con el token interno `x-internal-token`. El gateway bloquea `/api/v1/internal/*` (**403**). Los datos de tarjeta los recibe Stripe directamente (Payment Element); la clave secreta vive solo en el servidor.

Archivos clave: [`payment-service`](services/payment-service/src), [`plan-policy.ts`](services/auth-service/src/domain/policies/plan-policy.ts), [`consume-ai-plan.use-case.ts`](services/auth-service/src/application/use-cases/consume-ai-plan.use-case.ts), [`ai-plan-quota.middleware.ts`](services/api-gateway/src/adapters/http/middlewares/ai-plan-quota.middleware.ts), [`SubscriptionView.tsx`](apps/client/src/components/SubscriptionView.tsx).

---

## Documentación de arquitectura (C4)

| Documento | Contenido |
| :--- | :--- |
| [C4 Nivel 1: Contexto](docs/c4/c4-level1-context.md) | Actores (viajero, administrador), sistemas externos (SerpAPI, Hotels API, LLM, Stripe) y flujos de valor (incluido el manejo de suscripciones). |
| [C4 Nivel 2: Contenedores](docs/c4/c4-level2-containers.md) | Contenedores, puertos, bases de datos (Database-per-Service), autenticación en el gateway, concurrencia y planes de cuenta. |
| [C4 Nivel 3: Componentes](docs/c4/c4-level3-components.md) | Capas de Clean Architecture y secuencias de `auth-service`, Saga, Adapter, `payment-service` y Mediator. |

---

## Microservicios, puertos y bases de datos

```text
wayvo/
├── apps/
│   └── client/               # React + Vite + Tailwind (web responsive) [5173]
├── services/
│   ├── api-gateway/          # Express [3000] -> Facade + autenticación JWT
│   ├── auth-service/         # Node + TS [3004] -> usuarios, login, JWT
│   ├── booking-service/      # Node + TS [3001] -> Saga
│   ├── provider-service/     # Node + TS [3002] -> Adapter
│   ├── payment-service/      # Node + TS [3005] -> Adapter de pagos (Stripe) + Saga de activación
│   ├── trip-service/         # Node + TS [3003] -> Mediator
│   └── ai-recommendation/    # Python + FastAPI + LangGraph [8000]
├── shared/
│   └── contracts/            # @wayvo/contracts: DTOs y esquemas zod compartidos
├── docs/                     # C4 y guía de sustentación
└── docker-compose.yml
```

| Servicio | Tecnología | Puerto | Base de datos (puerto host) |
| :--- | :--- | :--- | :--- |
| `client` | React 18 + Vite | `5173` | — |
| `api-gateway` | Node.js + Express | `3000` | — (stateless) |
| `auth-service` | Node.js + TypeScript + Prisma | `3004` | PostgreSQL `auth_db` (`5436`) |
| `booking-service` | Node.js + TypeScript + Prisma | `3001` | PostgreSQL `booking_db` (`5433`) |
| `provider-service` | Node.js + TypeScript + Prisma | `3002` | PostgreSQL `provider_db` (`5434`) |
| `payment-service` | Node.js + TypeScript + Prisma | `3005` | PostgreSQL `payment_db` (`5437`) |
| `trip-service` | Node.js + TypeScript + Prisma | `3003` | PostgreSQL `trip_db` (`5435`) |
| `ai-recommendation` | Python + FastAPI + LangGraph | `8000` | — |

---

## Clean Architecture

```text
service/src/
├── domain/          # Entidades, value objects, reglas de negocio (sin frameworks)
├── application/     # Casos de uso, puertos (interfaces), Saga / Mediator / Facade
├── adapters/        # Controllers HTTP, middlewares, gateways y adapters externos
└── infrastructure/  # Prisma, Express, bcrypt, JWT, clientes HTTP, logger, container.ts
```

Las dependencias apuntan hacia adentro. Cada servicio elige sus implementaciones concretas solo en `infrastructure/container.ts` (raíz de composición): por ejemplo, `trip-service` usa PostgreSQL si hay `DATABASE_URL` y repositorios en memoria en los tests.

---

## Catálogo de endpoints

Todas las rutas pasan por el gateway (`http://localhost:3000`) y requieren `Authorization: Bearer <token>`, salvo las marcadas como **públicas**.

### Autenticación (`auth-service`)
| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | **Pública.** Crea la cuenta y devuelve `{ token, expiresAt, user }`. |
| `POST` | `/api/v1/auth/login` | **Pública.** Devuelve `{ token, expiresAt, user }`. |
| `GET` | `/api/v1/auth/me` | Usuario del token, con su `plan` (FREE / PREMIUM) y `entitlements` (planes de IA usados, límite y fecha de renovación). |

### Facade (`api-gateway`)
| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `POST` | `/api/v1/trips/plan` | Genera el plan con el motor multiagente (el `userId` sale del token). Cuenta FREE: máx. 5 por mes y sin presupuesto Lujo (**403** `AI_PLAN_LIMIT_REACHED` / `LUXURY_BUDGET_REQUIRES_PREMIUM`). |
| `POST` | `/api/v1/trips/checkout` | Confirma el viaje ejecutando la Saga. `201` confirmado, `409` compensado. |
| `GET` | `/health`, `/health/services` | **Públicas.** Estado del gateway y de los servicios. |

### Viajes (`trip-service`) - solo los del usuario
| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `GET` / `POST` | `/api/v1/trips` | Lista "mis viajes" / crea un viaje. |
| `GET` / `DELETE` | `/api/v1/trips/:id` | Detalle / eliminación. |
| `POST` | `/api/v1/trips/:id/start`, `/confirm`, `/cancel` | Cambios de estado del viaje. |
| `POST` | `/api/v1/trips/:id/incidents` | Reporta un imprevisto (Mediator, paso 1). |
| `POST` | `/api/v1/trips/:id/alternatives` | Elige una alternativa (Mediator, paso 2). |
| `POST` | `/api/v1/trips/:id/resolve-incident` | Aplica una alternativa propuesta por la IA. |
| `PATCH` / `POST` | `/api/v1/trips/:id/events/:eventId/...` | Reserva, inicio, finalización y cancelación de eventos. |

### Reservas y Saga (`booking-service`)
| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `POST` | `/api/v1/saga/confirm-trip` | Ejecuta la Saga (normalmente vía `/trips/checkout`). |
| `GET` | `/api/v1/saga/:correlationId/compensation-log` | Auditoría de compensaciones. |
| `POST` / `GET` | `/api/v1/bookings`, `/api/v1/bookings/:id` | Crear / consultar reserva propia. |
| `POST` | `/api/v1/bookings/:id/cancel` | Cancelar reserva propia. |

### Proveedores (`provider-service`)
| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/v1/providers` | Catálogo de proveedores verificados. |
| `POST` | `/api/v1/providers/check-availability` | Disponibilidad vía adapters. |
| `POST` | `/api/v1/providers/confirm` | Reserva atómica de cupos + confirmación externa. |
| `POST` | `/api/v1/providers/release` | Libera cupos de una reserva (`{ bookingId, items[] }`). Lo usa la compensación de la Saga. |
| `GET` | `/api/v1/mock/simulate-failure?mode=unavailable\|slow\|error\|normal` | **Solo ADMIN.** Simulador de fallos. |

### Pagos (`payment-service`) - suscripción PREMIUM
| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/v1/payments/plan` | Información del plan PREMIUM (USD 4.95 / mes). |
| `GET` | `/api/v1/payments/subscriptions/me` | Mi suscripción y mi plan efectivo. |
| `POST` | `/api/v1/payments/subscriptions` | Crea la suscripción y devuelve el `clientSecret` para el Payment Element de Stripe (`null` con el simulador). |
| `POST` | `/api/v1/payments/subscriptions/:id/activate` | Saga de activación: `200` PREMIUM activado, `402` pago no completado, `409` compensada, `500` compensación fallida. |
| `POST` | `/api/v1/payments/subscriptions/:id/cancel` | Cancela la suscripción; la cuenta vuelve a FREE. |
| `POST` | `/api/v1/payments/webhook` | **Pública (se valida con la firma de Stripe).** Renovaciones, cobros fallidos y cancelaciones. |
| `GET` | `/api/v1/mock/simulate-payment?mode=declined\|error\|slow\|normal&activation=ok\|fail` | **Solo ADMIN, solo con `PAYMENTS_MODE=mock`.** Simulador de fallos de pago y de activación. |

> Las rutas `/api/v1/internal/*` de `auth-service` (cambiar el plan de una cuenta, descontar o devolver un plan de IA) son solo entre servicios: el gateway las bloquea con **403**.

### IA (`ai-recommendation`)
| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `POST` | `/api/v1/ai/plan` | Ejecuta el grafo LangGraph (normalmente vía `/trips/plan`). También pasa por la cuota de planes de la cuenta. |
| `POST` | `/api/v1/ai/chat` | Chat libre con el asistente de viajes. |
| `POST` | `/api/v1/ai/incidents/resolve` | Alternativas contextuales ante un imprevisto (`incident_agent`). |

---

## Configuración (.env)

1. Copia la plantilla en la raíz del proyecto:
   ```powershell
   Copy-Item .env.example .env
   ```
2. Completa las variables. **`.env` nunca se sube a git** (está en `.gitignore`):

| Variable | Obligatoria | Descripción |
| :--- | :--- | :--- |
| `GOOGLE_API_KEY` | Sí (para la IA) | Clave de Gemini (Google AI Studio). |
| `GROQ_API_KEY`, `OPENROUTER_API_KEY` | No | LLM de respaldo si Gemini falla. |
| `JWT_SECRET` | Recomendada | Secreto para firmar los JWT (mismo valor para gateway y auth). Vacío = secreto de desarrollo. Generar uno con: `[Convert]::ToBase64String((1..48 \| ForEach-Object { Get-Random -Maximum 256 }))` |
| `ADMIN_EMAILS` | No | Correos (separados por coma) que reciben rol `ADMIN` al registrarse. |
| `EXTERNAL_PROVIDERS_MODE` | Sí | `real` (SerpAPI + Hotels API, requiere sus claves) o `mock` (simulador, sin claves). |
| `SERPAPI_API_KEY`, `HOTELS_API_KEY` | Si `real` | Claves de las APIs de vuelos y hoteles. |
| `PAYMENTS_MODE` | Sí | `mock` (simulador de pagos, sin claves ni cobros) o `real` (Stripe en modo de prueba). |
| `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID` | Si `real` | Clave secreta `sk_test_...` y precio recurrente mensual de USD 4.95 (`price_...`). Solo en el servidor. |
| `STRIPE_PUBLISHABLE_KEY` | Si `real` | Clave publicable `pk_test_...`; el navegador la usa para mostrar el formulario de pago. |
| `STRIPE_WEBHOOK_SECRET` | Recomendada | Secreto `whsec_...` del webhook (con el Stripe CLI: `stripe listen --events customer.subscription.updated,customer.subscription.deleted --forward-to localhost:3000/api/v1/payments/webhook`). Sin él los webhooks se rechazan. |
| `INTERNAL_SERVICE_TOKEN` | Producción | Token compartido por `auth-service`, `payment-service` y el gateway para las rutas internas. Vacío = token de desarrollo (en producción el servicio no arranca así). |
| `FREE_AI_PLANS_PER_MONTH`, `USAGE_TIMEZONE` | No | Planes de IA por mes de una cuenta FREE (5 por defecto) y zona horaria del mes calendario (`America/Bogota`). |
| `DEMO_AUTO_REFILL_CAPACITY` | No | `true` (por defecto) recarga cupos agotados; `false` muestra el rechazo real por falta de cupo. |

---

## Ejecución con Docker Compose

### Prerrequisitos
- **Docker Desktop** (Windows/Mac) o Docker Engine (Linux).
- Node.js 20+ y Python 3.11+ solo si se ejecuta sin Docker.

### Levantar todo
```powershell
docker compose up --build -d
```
Abre **http://localhost:5173**, crea una cuenta y empieza a planificar.

Contenedores esperados (`docker compose ps`): `wayvo-client`, `wayvo-api-gateway`, `wayvo-auth-service`, `wayvo-booking-service`, `wayvo-provider-service`, `wayvo-payment-service`, `wayvo-trip-service`, `wayvo-ai-recommendation`, `wayvo-auth-db`, `wayvo-booking-db`, `wayvo-provider-db`, `wayvo-payment-db`, `wayvo-trip-db`.

Las migraciones de Prisma se aplican solas al arrancar cada servicio.

### Desarrollo local (sin Docker para los servicios)
```powershell
docker compose up -d auth-db booking-db provider-db payment-db trip-db
npm install
npm run build:contracts
```
Luego, cada servicio en su propia terminal (cada uno necesita su propio `.env`, copiado de su `.env.example`):
```powershell
npm run dev:gateway   # 3000
npm run dev:auth      # 3004
npm run dev:booking   # 3001
npm run dev:provider  # 3002
npm run dev:payment   # 3005
npm run dev:trip      # 3003
npm run dev:client    # 5173
```

---

## Pruebas automatizadas

```powershell
npm run typecheck                                  # todo el monorepo
npm --prefix services/auth-service test
npm --prefix services/api-gateway test
npm --prefix services/booking-service test
npm --prefix services/provider-service test
npm --prefix services/payment-service test
npm --prefix services/trip-service test
cd services/ai-recommendation; python -m pytest    # requiere su entorno virtual
```

Los tests contra PostgreSQL real se activan con `TEST_DATABASE_URL` (ver el encabezado de cada archivo `*prisma*.test.ts`). Incluyen, entre otros, la prueba de concurrencia: 20 reservas simultáneas sobre 3 cupos deben dejar exactamente 3 ganadoras, y la del contador de planes de IA: 12 peticiones simultáneas con límite 5 dejan exactamente 5 aprobadas.

`payment-service` se prueba sin Stripe real: el simulador cubre el flujo feliz, el pago rechazado, la compensación cuando la cuenta falla y la firma del webhook.

---

## Guion de demostración

### 1. Multiusuario
1. En `http://localhost:5173` registra a **Ana** y crea un viaje.
2. Cierra sesión y registra a **Luis**: "Mis viajes" está vacío.
3. (Opcional, por API) con el token de Luis, `GET /api/v1/trips/<id de Ana>` → **404**; sin token → **401**.

### 2. Flujo completo con IA y Saga
1. Completa el onboarding (destino, fechas, estilo, presupuesto) → **Generar propuesta con IA**.
   - Cliente → Gateway (`/trips/plan`, Facade) → LangGraph → propuesta.
2. **Confirmar viaje** → Gateway (`/trips/checkout`) → Saga: crear viaje `PENDING` → crear reserva `PENDING` → reservar cupos → `CONFIRMED`.

### 3. Resiliencia: rollback de la Saga
Con un usuario **ADMIN** (correo en `ADMIN_EMAILS`), activa el modo **Dev** y el simulador:
```powershell
# o desde el Inspector Dev del cliente
curl.exe -H "Authorization: Bearer <token ADMIN>" "http://localhost:3000/api/v1/mock/simulate-failure?mode=unavailable"
```
Al confirmar un viaje, `booking-service` detecta el fallo y compensa: reserva y viaje quedan `CANCELLED`, se registra `CompensationLog` y el cliente muestra el motivo. Restaurar con `mode=normal`.

Alternativa sin modo caos: `DEMO_AUTO_REFILL_CAPACITY=false` en `.env` y una oferta sin cupo → la Saga compensa en el paso `RESERVE_PROVIDER`.

### 4. Incidencia en ruta (Mediator)
En un viaje activo, reporta un imprevisto (ej. "Perdí el tren") → el `TripMediator` registra la incidencia, propone alternativas y, al elegir una, reemplaza el evento en el itinerario.

### 5. Suscripción PREMIUM y límites de plan
1. Con una cuenta nueva (FREE), la barra superior muestra **FREE · 5/5**. En el paso de presupuesto, **Lujo Boutique** tiene candado: al pulsarlo se ofrece pasar a PREMIUM.
2. Genera planes de IA: el contador baja (4/5, 3/5...). Con 0/5 el botón se desactiva y el gateway responde **403** `AI_PLAN_LIMIT_REACHED`. Para verlo rápido: `FREE_AI_PLANS_PER_MONTH=1` en `.env`.
3. Pulsa el chip del plan → **Suscribirme por $4.95/mes**. Con `PAYMENTS_MODE=mock` se confirma un pago simulado; con `real`, usa la tarjeta de prueba `4242 4242 4242 4242`.
4. Al activarse, la cuenta pasa a **PREMIUM**: planes ilimitados y Lujo desbloqueado (`GET /api/v1/auth/me` muestra `plan: PREMIUM`).
5. **Compensación de la Saga de activación** (usuario ADMIN, `PAYMENTS_MODE=mock`): `GET /api/v1/mock/simulate-payment?activation=fail` y activa una suscripción nueva → **409** `SAGA_COMPENSATED`: se cobró, la cuenta falló, se canceló la suscripción y se devolvió el dinero; la cuenta sigue FREE. Con `?mode=declined` el pago rechazado responde **402** sin cobrar. Restaurar con `?mode=normal&activation=ok`.
6. **Cancelar suscripción** desde la misma pantalla: la cuenta vuelve a FREE de inmediato.

---

## Manejo centralizado de errores y trazabilidad (Req. 8.18)

Toda falla se devuelve con el mismo formato desde el middleware centralizado ([`error.middleware.ts`](services/api-gateway/src/adapters/http/middlewares/error.middleware.ts)) y desde cada servicio:

```json
{
  "success": false,
  "error": {
    "code": "SAGA_COMPENSATED",
    "message": "Trip could not be confirmed and was rolled back cleanly: ...",
    "details": { "correlationId": "gw-client-...", "failedStep": "RESERVE_PROVIDER" }
  }
}
```

Códigos frecuentes: `UNAUTHENTICATED` (401), `FORBIDDEN` (403), `AI_PLAN_LIMIT_REACHED` y `LUXURY_BUDGET_REQUIRES_PREMIUM` (403), `NOT_FOUND` (404), `VALIDATION_ERROR` (400), `PAYMENT_NOT_COMPLETED` (402), `SAGA_COMPENSATED` (409), `DOWNSTREAM_SERVICE_UNAVAILABLE` (503).

Cada petición lleva un `x-correlation-id` que viaja por todos los servicios, aparece en los logs y en `CompensationLog`, y se puede seguir desde el Inspector Dev del cliente.
