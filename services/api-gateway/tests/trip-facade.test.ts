import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/infrastructure/http/app';
import { TripFacade } from '../src/application/facades/trip.facade';
import { AiServicePort } from '../src/application/ports/ai-service.port';
import { BookingServicePort } from '../src/application/ports/booking-service.port';
import {
  BookingItemType,
  BudgetCategory,
  ConfirmTripSagaResult,
  CORRELATION_ID_HEADER,
  SagaStep,
} from '@wayvo/contracts';

describe('TripFacade - GoF Structural Pattern Tests', () => {
  // Mock implementations of ports
  const mockAiService: AiServicePort = {
    generatePlan: vi.fn(),
  };

  const mockBookingService: BookingServicePort = {
    executeConfirmTripSaga: vi.fn(),
  };

  const tripFacade = new TripFacade(mockAiService, mockBookingService);
  const app = createApp({ tripFacade });

  const samplePlanInput = {
    userId: 'usr-alexy',
    origin: 'Barranquilla',
    destination: 'Medellín',
    startDate: '2026-11-15',
    endDate: '2026-11-20',
    travelers: 2,
    budgetCategory: BudgetCategory.ESTANDAR,
    currency: 'COP',
    psychologicalAssessment: {
      spontaneityScore: 4,
      comfortPriority: 3,
      culturalCuriosity: 5,
      socialPreference: 'couple',
      physicalActivityLevel: 'moderate',
      interests: ['gastronomía', 'museos', 'café'],
    },
  };

  const sampleCheckoutInput = {
    userId: 'usr-alexy',
    currency: 'COP',
    trip: {
      destination: 'Medellín',
      startDate: '2026-11-15',
      endDate: '2026-11-20',
      origin: 'Barranquilla',
      travelers: 2,
    },
    items: [
      {
        type: BookingItemType.TRANSPORT,
        providerId: 'prov-avianca',
        offerId: 'flight-baq-mde',
        description: 'Vuelo directo Barranquilla - Medellín',
        quantity: 2,
        unitPrice: 280000,
      },
      {
        type: BookingItemType.ACCOMMODATION,
        providerId: 'prov-hotel-poblado',
        offerId: 'hotel-room-deluxe',
        description: 'Hotel Poblado Plaza (5 noches)',
        quantity: 1,
        unitPrice: 950000,
      },
    ],
  };

  describe('Endpoint: POST /api/v1/trips/plan (Planning Subsystem via Facade)', () => {
    it('should trigger AI planning and return consolidated plan envelope', async () => {
      const mockResult: any = {
        planId: 'plan-12345',
        tripDraft: {
          userId: 'usr-alexy',
          destination: 'Medellín',
          startDate: '2026-11-15',
          endDate: '2026-11-20',
        },
        personality: { analyzedStyle: 'Aventura' },
        budget: { estimatedTotalCost: 1500000 },
        transport: { routeSummary: 'Vuelo directo' },
        experiences: { gastronomy: [], activities: [] },
        itinerary: { days: [] },
        suggestedBookingItems: [],
      };

      vi.mocked(mockAiService.generatePlan).mockResolvedValueOnce(mockResult);

      const res = await request(app)
        .post('/api/v1/trips/plan')
        .set(CORRELATION_ID_HEADER, 'corr-plan-test')
        .send(samplePlanInput);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.plan.planId).toBe('plan-12345');
      expect(res.headers[CORRELATION_ID_HEADER]).toBe('corr-plan-test');
      expect(mockAiService.generatePlan).toHaveBeenCalledWith(
        expect.objectContaining({ destination: 'Medellín' }),
        'corr-plan-test',
      );
    });

    it('should generate contract-compliant fallback plan when ai-recommendation is offline', async () => {
      const realApp = createApp(); // Default instance with real HttpAiServiceGateway
      const res = await request(realApp)
        .post('/api/v1/trips/plan')
        .send(samplePlanInput);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.plan.planId).toBeDefined();
      expect(res.body.data.plan.personality.analyzedStyle).toBeDefined();
      expect(res.body.data.plan.budget.estimatedTotalCost).toBeGreaterThan(0);
      expect(res.body.data.plan.suggestedBookingItems.length).toBeGreaterThan(0);
    });

    it('should validate request schema and reject malformed inputs', async () => {
      const invalidInput = { ...samplePlanInput, destination: '' }; // destination min(1) violated

      const res = await request(app)
        .post('/api/v1/trips/plan')
        .send(invalidInput);

      expect(res.status).toBe(500); // Caught by global error handler
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('Endpoint: POST /api/v1/trips/checkout (Saga Subsystem via Facade)', () => {
    it('should trigger Saga and return 201 when trip is CONFIRMED', async () => {
      const confirmedResult: ConfirmTripSagaResult = {
        correlationId: 'corr-checkout-ok',
        status: 'CONFIRMED',
        tripId: 'trip-real-1',
        bookingId: 'book-real-1',
        reservationCode: 'RES-WAYVO-9988',
        failedStep: null,
        reason: null,
      };

      vi.mocked(mockBookingService.executeConfirmTripSaga).mockResolvedValueOnce(confirmedResult);

      const res = await request(app)
        .post('/api/v1/trips/checkout')
        .set(CORRELATION_ID_HEADER, 'corr-checkout-ok')
        .send(sampleCheckoutInput);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.saga.status).toBe('CONFIRMED');
      expect(res.body.data.saga.tripId).toBe('trip-real-1');
      expect(res.body.data.saga.reservationCode).toBe('RES-WAYVO-9988');
    });

    it('should return 409 with descriptive rollback details when Saga is COMPENSATED', async () => {
      const compensatedResult: ConfirmTripSagaResult = {
        correlationId: 'corr-checkout-rollback',
        status: 'COMPENSATED',
        tripId: 'trip-real-2',
        bookingId: 'book-real-2',
        reservationCode: null,
        failedStep: SagaStep.RESERVE_PROVIDER,
        reason: 'Provider LATAM reported no flight seats available',
      };

      vi.mocked(mockBookingService.executeConfirmTripSaga).mockResolvedValueOnce(compensatedResult);

      const res = await request(app)
        .post('/api/v1/trips/checkout')
        .set(CORRELATION_ID_HEADER, 'corr-checkout-rollback')
        .send(sampleCheckoutInput);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('SAGA_COMPENSATED');
      expect(res.body.error.message).toContain('Provider LATAM reported no flight seats available');
      expect(res.body.error.details.status).toBe('COMPENSATED');
    });

    it('should return 500 when Saga rollback fails (COMPENSATION_FAILED)', async () => {
      const failedResult: ConfirmTripSagaResult = {
        correlationId: 'corr-checkout-fail',
        status: 'COMPENSATION_FAILED',
        tripId: 'trip-real-3',
        bookingId: 'book-real-3',
        reservationCode: null,
        failedStep: SagaStep.COMPENSATE_TRIP,
        reason: 'Network failure during trip cancellation compensation',
      };

      vi.mocked(mockBookingService.executeConfirmTripSaga).mockResolvedValueOnce(failedResult);

      const res = await request(app)
        .post('/api/v1/trips/checkout')
        .send(sampleCheckoutInput);

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('SAGA_COMPENSATION_FAILED');
      expect(res.body.error.details.failedStep).toBe(SagaStep.COMPENSATE_TRIP);
    });
  });
});
