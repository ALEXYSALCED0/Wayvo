import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ApiResponse, CORRELATION_ID_HEADER } from '@wayvo/contracts';
import { mountMockApi, MOCK_BASE_PATH } from './infrastructure/mock/mount-mock';

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

// Simulador de APIs externas y endpoint de fallo controlado (no producción)
const consoleLogger = {
  info: (m: string, meta?: Record<string, unknown>) => console.log(`[Provider Service] ${m}`, meta ?? ''),
  warn: (m: string, meta?: Record<string, unknown>) => console.warn(`[Provider Service] ${m}`, meta ?? ''),
  error: (m: string, meta?: Record<string, unknown>) => console.error(`[Provider Service] ${m}`, meta ?? ''),
};
const mockState = mountMockApi(app, process.env, consoleLogger);

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`[Provider Service] Running on port ${port}`);
    if (mockState) console.log(`[Provider Service] Mock API at ${MOCK_BASE_PATH} (mode: ${mockState.status().activeMode})`);
  });
}

export { app };
