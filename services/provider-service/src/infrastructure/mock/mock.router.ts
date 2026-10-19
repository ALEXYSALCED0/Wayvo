import express, { Request, RequestHandler, Response, Router } from 'express';
import { LoggerPort } from '../../application/ports/logger.port';
import { MockExternalApi, MockProviderOutageError } from './mock-external-api';
import { MockSimulationState, parseSimulationQuery } from './simulation-state';

// Rutas del simulador
//   GET  /simulate-failure?mode=normal|unavailable|slow|error[&delayMs=..][&failureReason=..]
//                                  cambia el modo del proveedor falso (sin mode muestra el estado)
//   POST /reset                    restaura el inventario

//   GET  /external/flights/search  ?originAirport&destinationAirport&departureDate[&passengers][&cabinClass]
//   POST /external/flights/book    { flightNumber, departureDate, passengers, reference, passengerName?, passengerEmail? }
//   GET  /external/hotels/search   ?cityCode&checkInDate&checkOutDate[&guests][&roomType]
//   POST /external/hotels/book     { hotelCode, checkInDate, checkOutDate, rooms, reference, guestName?, guestEmail? }

export interface MockRouterDeps {
  state: MockSimulationState;
  external: MockExternalApi;
  logger?: LoggerPort;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const AIRPORT = /^[A-Za-z]{3}$/;
const CABINS = ['economy', 'business', 'first'] as const;
type Cabin = (typeof CABINS)[number];

class BadRequest extends Error {}

export function createMockRouter({ state, external, logger }: MockRouterDeps): Router {
  const router = Router();
  router.use(express.json());

  // control del simulador

  router.get('/simulate-failure', (req: Request, res: Response) => {
    const parsed = parseSimulationQuery(req.query as Record<string, unknown>);
    if (!parsed.ok) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_SIMULATION_QUERY', message: 'Invalid simulation parameters', details: parsed.details },
      });
      return;
    }
    if (parsed.update) {
      const status = state.update(parsed.update);
      logger?.warn('Mock provider simulation changed', { ...status });
      res.status(200).json({ success: true, data: status, message: `Simulation mode is now "${status.activeMode}"` });
      return;
    }
    res.status(200).json({ success: true, data: state.status() });
  });

  router.post('/reset', (_req: Request, res: Response) => {
    external.resetInventory();
    const status = state.reset();
    logger?.info('Mock provider reset', { ...status });
    res.status(200).json({ success: true, data: status, message: 'Simulation reset to "normal" and inventory restored' });
  });

  // APIs externas falsas

  router.get('/external/flights/search', handle(async (req, res) => {
    const q = req.query as Record<string, unknown>;
    const flights = await external.searchFlights({
      originAirport: airport(q.originAirport, 'originAirport'),
      destinationAirport: airport(q.destinationAirport, 'destinationAirport'),
      departureDate: date(q.departureDate, 'departureDate'),
      cabinClass: cabin(q.cabinClass),
    });
    positiveInt(q.passengers, 'passengers', 1);
    res.status(200).json({ flights });
  }));

  router.post('/external/flights/book', handle(async (req, res) => {
    const b = (req.body ?? {}) as Record<string, unknown>;
    const result = await external.bookFlight(
      text(b.flightNumber, 'flightNumber'),
      date(b.departureDate, 'departureDate'),
      positiveInt(b.passengers, 'passengers'),
    );
    text(b.reference, 'reference');
    res.status(200).json(
      result.status === 'CONFIRMED'
        ? { pnr: result.code, ticketNumber: result.ticketNumber, status: 'CONFIRMED' }
        : { pnr: '', status: 'REJECTED', reason: result.reason },
    );
  }));

  router.get('/external/hotels/search', handle(async (req, res) => {
    const q = req.query as Record<string, unknown>;
    const checkInDate = date(q.checkInDate, 'checkInDate');
    const checkOutDate = date(q.checkOutDate, 'checkOutDate');
    if (checkOutDate <= checkInDate) throw new BadRequest('checkOutDate must be after checkInDate');
    positiveInt(q.guests, 'guests', 1);
    const hotels = await external.searchHotels(text(q.cityCode, 'cityCode'), checkInDate, checkOutDate);
    res.status(200).json({ hotels });
  }));

  router.post('/external/hotels/book', handle(async (req, res) => {
    const b = (req.body ?? {}) as Record<string, unknown>;
    const checkInDate = date(b.checkInDate, 'checkInDate');
    const checkOutDate = date(b.checkOutDate, 'checkOutDate');
    if (checkOutDate <= checkInDate) throw new BadRequest('checkOutDate must be after checkInDate');
    text(b.reference, 'reference');
    const result = await external.bookRoom(text(b.hotelCode, 'hotelCode'), checkInDate, checkOutDate, positiveInt(b.rooms, 'rooms'));
    res.status(200).json(
      result.status === 'CONFIRMED'
        ? { bookingRef: result.code, status: 'CONFIRMED' }
        : { bookingRef: '', status: 'REJECTED', reason: result.reason },
    );
  }));

  return router;
}

// para capturar los errores de handlers async
function handle(fn: (req: Request, res: Response) => Promise<void>): RequestHandler {
  return (req, res) => {
    fn(req, res).catch((error: unknown) => {
      if (error instanceof MockProviderOutageError) {
        res.status(503).json({ error: error.message });
      } else if (error instanceof BadRequest) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Mock provider internal error' });
      }
    });
  };
}

function text(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.trim() === '') throw new BadRequest(`${name} is required`);
  return value.trim();
}

function airport(value: unknown, name: string): string {
  const code = text(value, name);
  if (!AIRPORT.test(code)) throw new BadRequest(`${name} must be a 3-letter airport code`);
  return code.toUpperCase();
}

function date(value: unknown, name: string): string {
  const day = text(value, name);
  if (!DATE.test(day) || Number.isNaN(Date.parse(`${day}T00:00:00Z`))) {
    throw new BadRequest(`${name} must be a date in YYYY-MM-DD format`);
  }
  return day;
}

function positiveInt(value: unknown, name: string, fallback?: number): number {
  if (value === undefined && fallback !== undefined) return fallback;
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
  if (!Number.isInteger(n) || n <= 0) throw new BadRequest(`${name} must be a positive integer`);
  return n;
}

function cabin(value: unknown): Cabin | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !(CABINS as readonly string[]).includes(value)) {
    throw new BadRequest(`cabinClass must be one of: ${CABINS.join(', ')}`);
  }
  return value as Cabin;
}
