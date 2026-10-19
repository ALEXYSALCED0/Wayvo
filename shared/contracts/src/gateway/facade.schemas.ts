import { confirmTripSagaSchema } from '../bookings/booking.schemas';
import { aiPlanRecommendationInputSchema } from '../profiles/profile.schemas';

export const tripPlanRequestSchema = aiPlanRecommendationInputSchema;
export const tripCheckoutRequestSchema = confirmTripSagaSchema;
