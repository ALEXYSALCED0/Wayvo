import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ApiResponse, CORRELATION_ID_HEADER } from '@wayvo/contracts';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Correlation ID Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const correlationId = (req.headers[CORRELATION_ID_HEADER] as string) || `gw-${Date.now()}`;
  res.setHeader(CORRELATION_ID_HEADER, correlationId);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  const response: ApiResponse<{ status: string; service: string }> = {
    success: true,
    data: { status: 'healthy', service: 'api-gateway' },
  };
  res.status(200).json(response);
});

// Centralized error middleware (Requisito 8.18)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const response: ApiResponse = {
    success: false,
    error: {
      code: err.code || 'GATEWAY_ERROR',
      message: err.message || 'An unexpected error occurred in API Gateway',
      details: err.details,
    },
  };
  res.status(err.status || 500).json(response);
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`[API Gateway] Running on port ${port}`);
  });
}

export { app };
