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

// Reportar incidencia
app.post(
  '/api/v1/trips/:id/incidents',
  eventController.reportIncident,
);

// Crear viaje
app.post('/api/v1/trips', tripController.createTrip);

// Consultar viaje
app.get('/api/v1/trips/:id', tripController.getTrip);

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`[Trip Service] Running on port ${port}`);
  });
}

export { app };
