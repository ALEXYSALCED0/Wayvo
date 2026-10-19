import { z } from 'zod';
import { createBookingItemSchema } from '../bookings/booking.schemas';
import { tripDraftSchema } from '../trips/trip.schemas';
import { BudgetCategory, PacePreference, TravelStyle } from './personality.dto';

export const travelStyleSchema = z.nativeEnum(TravelStyle);
export const budgetCategorySchema = z.nativeEnum(BudgetCategory);
export const pacePreferenceSchema = z.nativeEnum(PacePreference);

export const psychologicalAssessmentSchema = z.object({
  spontaneityScore: z.number().int().min(1).max(5),
  comfortPriority: z.number().int().min(1).max(5),
  culturalCuriosity: z.number().int().min(1).max(5),
  socialPreference: z.enum(['solo', 'couple', 'family', 'friends', 'group']),
  physicalActivityLevel: z.enum(['low', 'moderate', 'high']),
  interests: z.array(z.string()).default([]),
});

export const userPreferencesSchema = z.object({
  travelStyle: travelStyleSchema.optional(),
  budgetCategory: budgetCategorySchema.optional(),
  pace: pacePreferenceSchema.optional(),
  preferredSeating: z.string().optional(),
  dietaryRequirements: z.string().optional(),
  currency: z.string().length(3).optional(),
  languages: z.array(z.string()).optional(),
});

export const userProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  avatarUrl: z.string().url().optional(),
  statusTier: z.string().optional(),
  preferences: userPreferencesSchema.optional(),
  tripsCount: z.number().int().nonnegative().optional(),
  savedPlacesCount: z.number().int().nonnegative().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const onboardingProfileSchema = z.object({
  userId: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  origin: z.string().min(1),
  destination: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  travelers: z.number().int().positive().default(1),
  budgetCategory: budgetCategorySchema.default(BudgetCategory.ESTANDAR),
  currency: z.string().length(3).default('COP'),
  approximateBudgetAmount: z.number().positive().optional(),
  psychologicalAssessment: psychologicalAssessmentSchema,
  dietaryRestrictions: z.array(z.string()).optional(),
  travelStylePreference: travelStyleSchema.optional(),
});

export const aiPlanRecommendationInputSchema = z.object({
  userId: z.string().min(1),
  origin: z.string().min(1),
  destination: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  travelers: z.number().int().positive().default(1),
  budgetCategory: budgetCategorySchema.default(BudgetCategory.ESTANDAR),
  currency: z.string().length(3).default('COP'),
  approximateBudgetAmount: z.number().positive().optional(),
  psychologicalAssessment: psychologicalAssessmentSchema,
  dietaryRestrictions: z.array(z.string()).optional(),
  preferredStyle: travelStyleSchema.optional(),
});

export const quickChipSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  iconName: z.string().optional(),
  actionPayload: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

export const chatMessageSchema = z.object({
  id: z.string().min(1),
  sender: z.enum(['ai', 'user']),
  text: z.string().min(1),
  timestamp: z.string().min(1),
  quickChips: z.array(quickChipSchema).optional(),
  suggestedAction: z.object({
    type: z.enum(['NAVIGATE_TIMELINE', 'SHOW_OPTIONS', 'CONFIRM_ROUTE', 'UPDATE_BUDGET']),
    payload: z.unknown().optional(),
  }).optional(),
});

export const aiChatRequestSchema = z.object({
  userId: z.string().min(1),
  message: z.string().min(1),
  tripId: z.string().optional(),
  conversationHistory: z.array(chatMessageSchema).optional(),
  context: z.object({
    currentDestination: z.string().optional(),
    budgetCategory: z.string().optional(),
    travelStyle: z.string().optional(),
  }).optional(),
});
