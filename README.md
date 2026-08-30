# Wayvo AI Travel Platform ✈️🚆

Wayvo is an intelligent travel architecture platform designed to coordinate seamless, multi-modal personalized journeys, dynamic disruption recalculations, and real-time itinerary lifecycles.

---

## 🏛️ Architecture Overview

Wayvo is conceptualized around a **Microservices Architecture** with distributed operations coordinated via **Saga** and localized service interactions decoupled through the **GoF Mediator Pattern**.

For this university prototype, the system is implemented as a **Modular Monolith** that defines strict domain and service boundaries matching the future distributed microservices.

```
                             Mobile Frontend (React Native + Expo)
                                              │
                                              ▼ (REST API)
                             ┌───────────────────────────────────┐
                             │       Express API Routing         │
                             └─────────────────┬─────────────────┘
                                               │
               ┌───────────────────────────────┼───────────────────────────────┐
               ▼                               ▼                               ▼
       Trip Service                     Event Service                Alternative Service
 (Trip & Template Boundary)       (Lifecycle & Reservation)     (Disruption Recommendation Pool)
               │                               │                               │
               └───────────────────────────────┼───────────────────────────────┘
                                               ▼
                                  ┌──────────────────────────┐
                                  │   TripMediator (GoF)     │
                                  └────────────┬─────────────┘
                                               │
                                               ▼
                                 InMemoryTripRepository (Seed Data)
```

---

## 🧩 The GoF Mediator Pattern

The core architectural pattern implemented in this version is the **GoF Mediator Pattern** (`/backend/src/mediator/TripMediator.ts`).

### Why Mediator?
In a travel platform, when a disruption occurs (e.g., a missed train, a closed museum, or an extended stay), updating the itinerary requires:
1. Validating and marking the event status as `ISSUE` via `EventService`.
2. Generating tailored alternative routes and replacement activities via `AlternativeService`.
3. Updating and attaching new alternative options to the trip timeline via `TripService`.

Without a Mediator, these services would directly depend on and call each other, resulting in tight coupling and cascading side-effects. The `TripMediator` centralizes and coordinates this workflow cleanly:

```
React Native App
      ↓  POST /api/trips/:tripId/events/:eventId/report-issue
EventController
      ↓
TripMediator (GoF)
      ├──> EventService.markEventAsIssue(tripId, eventId, issueType, reason)
      ├──> AlternativeService.generateAlternatives(event, issueType, reason)
      └──> TripService.attachAlternativesToEvent(tripId, eventId, alternatives)
      ↓
Updated Trip & Alternatives
      ↓
React Native App (Renders Recalculating -> Alternatives Generated)
```

---

## 📂 Project Structure

```
Wayvo/
├── backend/                             # Modular Monolith Backend (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── config/                      # Environment and server configuration
│   │   ├── domain/
│   │   │   ├── enums/                   # EventType, EventStatus, ReservationStatus, IssueType
│   │   │   └── models/                  # User, Trip, TripTemplate, Event, AlternativeOption
│   │   ├── mediator/                    # Real GoF Mediator implementation (IMediator, TripMediator)
│   │   ├── services/                    # TripService, EventService, AlternativeService
│   │   ├── repositories/                # ITripRepository, InMemoryTripRepository
│   │   ├── controllers/                 # TripController, EventController
│   │   ├── routes/                      # REST endpoints for trips, events, templates, mediator actions
│   │   ├── data/                        # Seed data (European Adventure, Tokyo, Rome, Mediterranean)
│   │   └── index.ts                     # Express server entrypoint (0.0.0.0, CORS, Health check)
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                            # React Native Mobile Application (Expo SDK 54)
│   ├── src/
│   │   ├── components/                  # UI components (Timeline, Navigation, AI, Discover, Common)
│   │   ├── context/                     # Global state (TripContext, AIContext)
│   │   ├── navigation/                  # Bottom Tab & Stack Navigators
│   │   ├── screens/                     # HomeScreen, DetailedTimelineScreen, TripsScreen, WayvoAIScreen, etc.
│   │   ├── services/api/                # Dedicated API Client layer (tripApi, eventApi)
│   │   ├── theme/                       # Design tokens, colors (Havelock Blue), typography (Rubik)
│   │   └── types/                       # Shared domain TypeScript types
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18 or newer
- **npm** or **yarn**
- **Expo Go** app on your physical mobile device (or iOS Simulator / Android Emulator)

---

### 1. Starting the Backend Server

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Build TypeScript
npm run build

# Start the server (Listens on 0.0.0.0:3000)
npm start

# (Optional) Run in development mode with live reload
npm run dev
```

Verify backend health:
```bash
curl http://localhost:3000/api/health
# Response: {"status":"ok","service":"wayvo-backend","mediator":"TripMediator active"}
```

---

### 2. Starting the Frontend (React Native)

```bash
# In a separate terminal, navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the Expo development server
npx expo start -c
```

---

## 📱 Mobile Networking Configuration

When connecting your frontend to the backend, set the `EXPO_PUBLIC_API_BASE_URL` environment variable depending on your testing environment:

| Testing Target | Configuration | Description |
|---|---|---|
| **Physical Device (LAN)** | `EXPO_PUBLIC_API_BASE_URL=http://<YOUR_LOCAL_IP>:3000/api` | Connects your phone to your computer over Wi-Fi (e.g. `http://192.168.40.76:3000/api`). |
| **iOS Simulator** | `EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api` | Shares localhost directly with macOS. |
| **Android Emulator** | `EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000/api` | Android emulator alias pointing to the host loopback. |
| **Production / Cloud** | `EXPO_PUBLIC_API_BASE_URL=https://<your-deployed-backend>/api` | Deployed backend (Render, Railway, etc.). |

> [!NOTE]
> The backend Express server listens on `0.0.0.0` by default so physical mobile devices on the same Wi-Fi network can connect seamlessly without firewall blockage.

---

## 📡 REST API Reference

### Health & Diagnostic
- `GET /api/health`: Health status and active mediator verification.

### Trips & Templates
- `GET /api/trips`: Retrieve all trips for the demo user.
- `GET /api/trips/:tripId`: Retrieve single trip with full timeline events.
- `POST /api/trips`: Create a new custom trip.
- `GET /api/trip-templates`: Retrieve available journey templates (*Tokyo, Rome, Alps, Mediterranean*).
- `POST /api/trips/from-template/:templateId`: Instantiate a live trip from a template.
- `POST /api/trips/reset-demo`: Reset the in-memory repository to initial demonstration state.

### Events & Lifecycle
- `GET /api/trips/:tripId/events`: Retrieve all events for a trip.
- `GET /api/trips/:tripId/events/:eventId`: Retrieve single event details.
- `POST /api/trips/:tripId/events/:eventId/reserve`: Confirm booking (`reservationStatus: CONFIRMED`, `status: PENDING`).
- `POST /api/trips/:tripId/events/:eventId/complete`: Explicitly complete event (`status: COMPLETED`, locked from issues).

### Mediator & Disruption Workflow
- `POST /api/trips/:tripId/events/:eventId/report-issue`: Reports disruption (`MISSED`, `CANCELLED`, `USER_CHANGED_PLAN`, `UNAVAILABLE`) and coordinates recalculation through `TripMediator`.
- `GET /api/trips/:tripId/events/:eventId/alternatives`: Retrieve generated alternative options.
- `POST /api/trips/:tripId/events/:eventId/alternatives/:alternativeId/select`: Selects and applies an alternative route to the timeline.

---

## 🎬 End-to-End Presentation Demonstration Flow

Follow this sequence for the academic demonstration:

1. **Explore & Create Live Trip**:
   - Open Wayvo on your phone.
   - On the **Home** tab, scroll to **Personalized Journeys**.
   - Tap *"Tokyo: Urban Culture & Tech"* -> backend creates a live trip from the template (`POST /api/trips/from-template/template-tokyo`).
   - The app navigates to **My Trips**, where the new trip appears immediately.

2. **Inspect Event Lifecycle & Booking**:
   - Open *"European Adventure"*.
   - Tap on *"High-Speed Train to Paris"*.
   - View booking details showing `reservationStatus: CONFIRMED` while `status: PENDING` (*Booked, but not yet occurred*).

3. **Report Issue through Mediator**:
   - Tap **Report Issue** on the train event (or the bottom red bar).
   - Select *"I missed my train / transport"* (`MISSED`).
   - Notice the blue **"Wayvo is recalculating your route..."** banner.
   - The backend `TripMediator` marks the event as `ISSUE`, triggers `AlternativeService` to generate 3 tailored alternative routes (Eurostar Next Express, FlixBus Executive, Alpine Sleeper), and updates `TripService`.
   - The alternatives appear with match scores, prices, and timing.

4. **Apply Alternative**:
   - Select *"Eurostar Next Express (Standard Premier)"*.
   - Tap *"Choose this route & Update Timeline"*.
   - The timeline reorganizes with the previous event marked as *"Missed / Replaced"* and the new confirmed alternative injected.

5. **Manual Event Completion**:
   - Expand an event and tap **"Mark as completed"**.
   - The node turns **green** (`COMPLETED`).
   - The event becomes **locked** and can no longer be modified by disruptions.

6. **Generic Event Support**:
   - Repeat the issue reporting flow on other event types (e.g. *Museum closed* or *Flight missed*) to demonstrate that the backend Mediator and AlternativeService handle generic domain events rather than hardcoded train-only logic.

---

## 🔮 Future Roadmap

- **Distributed Microservices**: Extracting `TripService`, `EventService`, and `AlternativeService` into independent microservices behind an API Gateway.
- **Saga Orchestrator**: Implementing Saga state machines to coordinate distributed two-phase booking cancellations and compensations across external providers.
- **Multi-Agent AI**: Integrating Wayvo's autonomous multi-agent recommendation engine for real-time dynamic pricing and contextual discovery.

---

## 👥 Authors
- **Wayvo Architecture Team** - *Distributed Systems & Software Design Patterns*
