import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ApiResponse, CORRELATION_ID_HEADER } from '@wayvo/contracts';
import { buildContainer } from './infrastructure/container';
import { EventController } from './adapters/controllers/EventController';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3003);

app.use(cors());
app.use(express.json());

// Correlation ID Middleware
app.use((req: Request, res: Response, next) => {
  const correlationId =
    (req.headers[CORRELATION_ID_HEADER] as string) || `trip-${Date.now()}`;

  res.setHeader(CORRELATION_ID_HEADER, correlationId);
  next();
});

// Dependencias
const { mediator, tripController } = buildContainer();
const eventController = new EventController(mediator);

// Health check
app.get('/health', (req: Request, res: Response) => {
  const response: ApiResponse<{ status: string; service: string }> = {
    success: true,
    data: { status: 'healthy', service: 'trip-service' },
  };

  res.status(200).json(response);
});

// Incidencias (patrón Mediator)
// Paso 1: reportar el problema y recibir alternativas
app.post('/api/v1/trips/:id/incidents', eventController.reportIncident);
// Paso 2: elegir una alternativa y actualizar el itinerario
app.post('/api/v1/trips/:id/alternatives', eventController.selectAlternative);

// Crear viaje y listar viajes por usuario
app.post('/api/v1/trips', tripController.createTrip);
app.get('/api/v1/trips', tripController.listTrips);

// Consultar viaje
app.get('/api/v1/trips/:id', tripController.getTrip);
app.post('/api/v1/trips/:id/events', tripController.addEvents);

// Iniciar viaje (cuando llega su fecha o por demo bypass)
app.post('/api/v1/trips/:id/start', tripController.startTrip);

// Confirmar, cancelar y eliminar viaje
app.post('/api/v1/trips/:id/confirm', tripController.confirmTrip);
app.post('/api/v1/trips/:id/cancel', tripController.cancelTrip);
app.patch('/api/v1/trips/:id/cancel', tripController.cancelTrip);
app.delete('/api/v1/trips/:id', tripController.deleteTrip);

// Resolución reactiva de eventualidad (cancelación de evento original + inserción de sustitutos)
app.post('/api/v1/trips/:id/resolve-incident', tripController.resolveIncident);

// Gestión individual de eventos del itinerario
app.patch('/api/v1/trips/:id/events/:eventId/reservation', tripController.updateEventReservation);
app.post('/api/v1/trips/:id/events/:eventId/start', tripController.startEvent);
app.post('/api/v1/trips/:id/events/:eventId/complete', tripController.completeEvent);
app.post('/api/v1/trips/:id/events/:eventId/cancel', tripController.cancelEvent);

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`[Trip Service] Running on port ${port}`);
  });
}

export { app };
