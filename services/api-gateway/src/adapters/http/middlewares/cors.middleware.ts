import cors, { CorsOptions } from 'cors';
import { CORRELATION_ID_HEADER } from '@wayvo/contracts';
import { config } from '../../../infrastructure/config/env';

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Permite requests sin origen (curl, mobile apps) o cualquier origen si CORS_ORIGIN es '*'
    if (!origin || config.CORS_ORIGIN === '*' || config.CORS_ORIGIN.split(',').includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    CORRELATION_ID_HEADER,
  ],
  exposedHeaders: [CORRELATION_ID_HEADER],
  credentials: true,
};

export const corsMiddleware = cors(corsOptions);
