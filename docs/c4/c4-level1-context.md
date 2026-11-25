# C4 Model - Nivel 1: Diagrama de Contexto del Sistema

## 1. Visión General del Sistema Wayvo

Wayvo es una plataforma **multiusuario** de planificación, reservas y gestión dinámica de viajes construida sobre una arquitectura de microservicios. Acompaña al viajero antes, durante y después del viaje:

1. **Cuenta propia (multiusuario):** cada viajero se registra e inicia sesión. Sus viajes, reservas e itinerarios son privados: ningún otro usuario puede verlos ni modificarlos.
2. **Antes del viaje:** perfila al viajero con un sistema multiagente de IA (LangGraph + Gemini) que genera propuestas de itinerario personalizadas balanceando presupuesto, transporte, alojamiento y actividades.
3. **Confirmación:** confirma los servicios con una transacción distribuida resiliente (patrón **Saga**), con compensación automática si algún proveedor falla. Las reservas de cupos son atómicas: dos viajeros no pueden quedarse con el mismo último cupo.
4. **Durante el viaje:** el viajero marca el avance de su itinerario, reporta incidencias (vuelo cancelado, tren perdido, lluvia) y recibe alternativas que se integran al itinerario mediante el patrón **Mediator**.
5. **Suscripción PREMIUM:** un único plan de pago (USD 4.95 al mes) con la pasarela **Stripe**. La cuenta **FREE** genera hasta 5 planes de IA por mes y no accede al presupuesto Lujo; la cuenta **PREMIUM** no tiene límite y accede a todos los presupuestos. Planificar y calcular el presupuesto es gratis.

---

## 2. Diagrama de Contexto (Mermaid C4)

```mermaid
flowchart TD
    classDef person fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#f8fafc;
    classDef system fill:#0f172a,stroke:#0284c7,stroke-width:3px,color:#f8fafc;
    classDef external fill:#1e1e2f,stroke:#64748b,stroke-width:2px,stroke-dasharray: 5 5,color:#cbd5e1;

    %% Actores
    Viajero["Viajero<br/><b>[Persona - rol TRAVELER]</b><br/>Se registra, planifica viajes según su estilo, confirma reservas, gestiona su itinerario y reporta eventualidades."]:::person
    Admin["Administrador<br/><b>[Persona - rol ADMIN]</b><br/>Todo lo del viajero, más el Inspector Dev: trazas, simulación de fallos (modo caos) y auditoría de la Saga."]:::person

    %% Sistema Central
    WayvoSystem["Plataforma Wayvo<br/><b>[Sistema de Software]</b><br/>Microservicios con Clean Architecture, autenticación JWT, planes FREE/PREMIUM, motor multiagente LangGraph y cliente web responsive."]:::system

    %% Sistemas Externos
    APITransporte["Proveedores de Transporte<br/><b>[Sistema Externo]</b><br/>SerpAPI (Google Flights)."]:::external
    APIAlojamiento["Proveedores de Alojamiento<br/><b>[Sistema Externo]</b><br/>Hotels API."]:::external
    LLMProvider["Proveedor de LLM<br/><b>[Sistema Externo]</b><br/>Google Gemini (principal); Groq y OpenRouter como respaldo."]:::external
    Stripe["Stripe<br/><b>[Sistema Externo]</b><br/>Cobro mensual de la suscripción PREMIUM y webhooks de renovación y cancelación."]:::external

    %% Relaciones
    Viajero -->|"Se registra / inicia sesión, planifica, confirma, reporta incidencias y se suscribe a PREMIUM [HTTPS + JWT]"| WayvoSystem
    Viajero -->|"Ingresa los datos de su tarjeta en el formulario de Stripe [HTTPS]"| Stripe
    Admin -->|"Inspecciona trazas y simula fallos de proveedores [HTTPS + JWT rol ADMIN]"| WayvoSystem

    WayvoSystem -->|"Consulta disponibilidad y confirma reservas [HTTPS / JSON]"| APITransporte
    WayvoSystem -->|"Consulta tarifas y confirma estadías [HTTPS / JSON]"| APIAlojamiento
    WayvoSystem -->|"Prompts de perfilamiento, plan, chat e incidencias [HTTPS]"| LLMProvider
    WayvoSystem -->|"Crea y cobra la suscripción PREMIUM [HTTPS / JSON]"| Stripe
    Stripe -->|"Webhooks firmados: renovación, cobro fallido, cancelación [HTTPS]"| WayvoSystem
```

---

## 3. Catálogo de Actores y Sistemas

### 3.1 Actores

| Actor | Rol | Interacción con Wayvo |
| :--- | :--- | :--- |
| **Viajero** | `TRAVELER` (rol por defecto al registrarse) | Usa la aplicación web para crear su cuenta, completar el perfilamiento, evaluar propuestas de la IA, confirmar el viaje y administrar su itinerario en tiempo real. Puede suscribirse a PREMIUM desde la pantalla de su plan. Solo ve sus propios viajes y reservas. |
| **Administrador** | `ADMIN` (correos definidos en `ADMIN_EMAILS`) | Además de lo anterior, activa el **modo Dev**: Inspector de red, bitácora de compensaciones (`CompensationLog`) y simulador de fallos de proveedores (`/api/v1/mock/*`, bloqueado para viajeros con HTTP 403). |

### 3.2 Sistema central: Plataforma Wayvo

Delimitado dentro del monorepo:
- **Cliente web (`apps/client`):** React + Vite + Tailwind, responsive para escritorio y móvil. Pantalla de login/registro, sesión con JWT y pantalla de suscripción con el Payment Element de Stripe.
- **API Gateway (`services/api-gateway`):** punto único de entrada. Valida el JWT, propaga la identidad (`x-user-id`), implementa el patrón **Facade** y el middleware centralizado de errores (Requisito 8.18).
- **Auth Service (`services/auth-service`):** registro, login y emisión de tokens JWT (multiusuario). Guarda el **plan de la cuenta** (FREE / PREMIUM) y cuenta los planes de IA de cada mes.
- **Payment Service (`services/payment-service`):** suscripción mensual PREMIUM con Stripe detrás del patrón **Adapter** y Saga de activación con compensación.
- **Booking Service (`services/booking-service`):** reservas y orquestador de la **Saga**.
- **Provider Service (`services/provider-service`):** catálogo de proveedores, reserva atómica de cupos y patrón **Adapter** hacia las APIs externas.
- **Trip Service (`services/trip-service`):** ciclo de vida del viaje e itinerario; patrón **Mediator** para incidencias.
- **AI Recommendation (`services/ai-recommendation`):** grafo multiagente LangGraph (Python) para el plan de viaje, chat e incidencias.

### 3.3 Sistemas externos

| Sistema Externo | Tipo | Propósito |
| :--- | :--- | :--- |
| **SerpAPI (Google Flights)** | API REST | Vuelos: tarifas, horarios y disponibilidad. Integrado con `TransporteAdapter`. |
| **Hotels API** | API REST | Inventario hotelero. Integrado con `AlojamientoAdapter`. |
| **Google Gemini / Groq / OpenRouter** | API de LLM | Inferencia para los agentes de LangGraph. Si un proveedor falla por cuota o red, se conmuta al siguiente. |
| **Stripe** | Pasarela de pagos | Cobro recurrente de la suscripción PREMIUM. Integrado con `StripePaymentAdapter` (modo de prueba en desarrollo). Los datos de la tarjeta los recibe Stripe directamente: nunca pasan por Wayvo. Avisa por webhook las renovaciones, cobros fallidos y cancelaciones. |

---

## 4. Flujos de Valor a Nivel de Contexto

### Flujo 0: Registro e inicio de sesión (multiusuario)
1. El viajero crea su cuenta (nombre, correo, contraseña) o inicia sesión.
2. Wayvo devuelve un token de sesión (JWT) que el cliente envía en cada petición.
3. Desde ese momento todo lo que crea (viajes, reservas) queda a su nombre y es invisible para otros usuarios.

### Flujo 1: Planificación inteligente asistida por IA
1. El viajero completa el perfilamiento (presupuesto, fechas, acompañantes, intereses).
2. Los agentes de IA sintetizan su estilo de viaje (Aventura, Relax, Cultural, Gastronómico, Eco-Turismo) y arman transporte, alojamiento, actividades y presupuesto.
3. Wayvo devuelve una propuesta de itinerario con el desglose de costos.

### Flujo 2: Confirmación con garantía de consistencia (Saga)
1. El viajero confirma su viaje.
2. Wayvo crea el viaje y la reserva, y aparta los cupos con los proveedores.
3. Si un proveedor rechaza o no hay cupo, se ejecuta un rollback compensatorio automático y el viajero recibe un mensaje claro, sin registros huérfanos.

### Flujo 3: Adaptabilidad en ruta (Mediator)
1. Durante el viaje, el viajero reporta una eventualidad (ej. "Perdí el vuelo").
2. Wayvo registra la incidencia, propone alternativas y, al elegir una, reemplaza el evento afectado en el itinerario.

### Flujo 4: Suscripción PREMIUM
1. El viajero con cuenta FREE llega a su límite (5 planes de IA por mes) o intenta usar el presupuesto Lujo y Wayvo le ofrece pasar a PREMIUM.
2. El viajero se suscribe: ingresa su tarjeta en el formulario seguro de Stripe y Wayvo confirma el cobro.
3. La cuenta pasa a PREMIUM (planes ilimitados y todos los presupuestos). Si se cobró pero la cuenta no se pudo actualizar, Wayvo cancela la suscripción y devuelve el dinero automáticamente (compensación de la Saga).
4. Stripe avisa por webhook las renovaciones, los cobros fallidos y las cancelaciones, y la cuenta vuelve a FREE cuando la suscripción deja de estar vigente.
