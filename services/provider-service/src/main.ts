import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ApiResponse, CORRELATION_ID_HEADER } from '@wayvo/contracts';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3002);

app.use(cors());
app.use(express.json());

// Correlation ID Middleware
app.use((req: Request, res: Response, next) => {
  const correlationId = (req.headers[CORRELATION_ID_HEADER] as string) || `prov-${Date.now()}`;
  res.setHeader(CORRELATION_ID_HEADER, correlationId);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  const response: ApiResponse<{ status: string; service: string }> = {
    success: true,
    data: { status: 'healthy', service: 'provider-service' },
  };
  res.status(200).json(response);
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`[Provider Service] Running on port ${port}`);
  });
}

export { app };
