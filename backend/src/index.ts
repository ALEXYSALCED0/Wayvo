/**
 * Wayvo Backend - Modular Monolith with GoF Mediator Pattern
 * Entrypoint for REST API server
 */
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config/env';
import { tripRepository } from './repositories/InMemoryTripRepository';
import { TripService } from './services/TripService';
import { EventService } from './services/EventService';
import { AlternativeService } from './services/AlternativeService';
import { TripMediator } from './mediator/TripMediator';
import { TripController } from './controllers/TripController';
import { EventController } from './controllers/EventController';
import { createTripRoutes } from './routes/tripRoutes';
import { createEventRoutes } from './routes/eventRoutes';

const app = express();

// Middleware
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

// Request logger for development / presentation
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[HTTP] ${req.method} ${req.path}`);
  next();
});

// Dependency Injection (Modular Monolith Boundaries)
const tripService = new TripService(tripRepository);
const eventService = new EventService(tripRepository);
const alternativeService = new AlternativeService();

// Real GoF Mediator Instance
const tripMediator = new TripMediator(tripService, eventService, alternativeService);

// Controllers
const tripController = new TripController(tripService);
const eventController = new EventController(eventService, tripMediator);

// Health Check Endpoint (Deployment & Verification)
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'wayvo-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    mediator: 'TripMediator active',
  });
});

// API Routes
app.use('/api', createTripRoutes(tripController));
app.use('/api', createEventRoutes(eventController));

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error Handler]', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

// Start Server listening on 0.0.0.0 for local LAN & Cloud Deployments
app.listen(config.port, config.host, () => {
  console.log(`=================================================`);
  console.log(`🚀 Wayvo Backend running on http://${config.host}:${config.port}`);
  console.log(`🏥 Health Check: http://${config.host}:${config.port}/api/health`);
  console.log(`🌐 Mediator Pattern initialized and active`);
  console.log(`=================================================`);
});

export default app;
