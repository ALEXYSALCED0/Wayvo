import type { ApiResponse, CheckAvailabilityResponse, ConfirmProviderReservationResponse } from '@wayvo/contracts';
import { CheckAvailabilityOutput } from '../../application/dtos/availability.dto';
import { ConfirmReservationOutput } from '../../application/dtos/reservation.dto';
import { ProviderWithOffersOutput } from '../../application/use-cases/list-providers.use-case';

// Todas las respuestas usan el sobre ApiResponse de Wayvo ({ success, data?, message?, error? }).
// El tipo de `data` viene de @wayvo/contracts

export const ok = <T>(data: T, message?: string): ApiResponse<T> => ({
  success: true,
  data,
  ...(message && { message }),
});

export const fail = (code: string, message: string, details?: unknown): ApiResponse<never> => ({
  success: false,
  error: { code, message, ...(details !== undefined && { details }) },
});

// El contrato (Provider) usa campos opcionales, no null (se omiten)
export function presentProvider(provider: ProviderWithOffersOutput) {
  const { verificationNote, contactPhone, rating, websiteUrl, ...rest } = provider;
  return {
    ...rest,
    ...(verificationNote !== null && { verificationNote }),
    ...(contactPhone !== null && { contactPhone }),
    ...(rating !== null && { rating }),
    ...(websiteUrl !== null && { websiteUrl }),
  };
}

export function presentAvailability(output: CheckAvailabilityOutput): CheckAvailabilityResponse {
  return output;
}

export function presentConfirmation(
  output: ConfirmReservationOutput,
): ConfirmProviderReservationResponse & { items: ConfirmReservationOutput['items'] } {
  return output;
}
