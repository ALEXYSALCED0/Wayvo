import {
  ConfirmTripSagaInput,
  ConfirmTripSagaResult,
  CORRELATION_ID_HEADER,
} from '@wayvo/contracts';
import { BookingServicePort } from '../../application/ports/booking-service.port';
import { BadGatewayError, ServiceUnavailableError } from '../../domain/errors/gateway.error';
import { config } from '../../infrastructure/config/env';

export class HttpBookingServiceGateway implements BookingServicePort {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs: number = 8000,
  ) {}

  async executeConfirmTripSaga(
    input: ConfirmTripSagaInput,
    correlationId: string,
  ): Promise<ConfirmTripSagaResult> {
    const url = `${this.baseUrl}/api/v1/saga/confirm-trip`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [CORRELATION_ID_HEADER]: correlationId,
        },
        body: JSON.stringify(input),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const body = (await response.json()) as any;

      // 201 CONFIRMED
      if (response.status === 201 || (response.ok && body.data)) {
        return body.data as ConfirmTripSagaResult;
      }

      // 409 COMPENSATED (Saga executed rollback)
      if (response.status === 409 && body.error?.details) {
        return body.error.details as ConfirmTripSagaResult;
      }

      // 500 COMPENSATION_FAILED or other error with details
      if (body.error?.details?.status) {
        return body.error.details as ConfirmTripSagaResult;
      }

      throw new BadGatewayError(
        'booking-service',
        body.error?.message || `Booking service saga failed with status ${response.status}`,
      );
    } catch (err: any) {
      if (err instanceof BadGatewayError) throw err;

      // If mock fallback is enabled and booking-service is offline, provide a valid fallback Saga
      if (config.ENABLE_MOCK_FALLBACK) {
        console.warn(
          `[HttpBookingServiceGateway] booking-service is unreachable (${err.message}). Using fallback Saga response.`,
        );
        return {
          correlationId: correlationId || `fallback-saga-${Date.now()}`,
          status: 'CONFIRMED',
          tripId: `trip-${Date.now()}`,
          bookingId: `bk-${Date.now().toString(36)}`,
          reservationCode: `RES-WAYVO-${Date.now().toString(36).toUpperCase()}`,
          failedStep: null,
          reason: null,
        };
      }

      throw new ServiceUnavailableError('booking-service', url, err.message);
    }
  }
}

