import { CreateBookingItemInput } from '../bookings/booking.dto';
import { Event } from '../trips/event.dto';
import { DayPlan } from '../trips/itinerary.dto';
import { TripDraft } from '../trips/trip.dto';
import { BudgetCategory, PacePreference, PsychologicalAssessment, TravelStyle } from './personality.dto';

/**
 * Output of LangGraph Node: personality_agent
 */
export interface PersonalityAgentOutput {
  analyzedStyle: TravelStyle;
  traitSummary: string;
  dominantPace: PacePreference;
  psychologicalNotes?: string;
  recommendedVibe: string;
}

/**
 * Output of LangGraph Node: budget_agent
 */
export interface BudgetBreakdown {
  transport: number;
  accommodation: number;
  activities: number;
  food: number;
  emergencyFund?: number;
}

export interface BudgetAgentOutput {
  category: BudgetCategory;
  currency: string;
  estimatedTotalCost: number;
  dailyBudget: number;
  breakdown: BudgetBreakdown;
  savingsTips?: string[];
}

/**
 * Output of LangGraph Node: transport_agent
 */
export interface TransportRouteSegment {
  origin: string;
  destination: string;
  mode: 'flight' | 'train' | 'bus' | 'car_rental' | 'ferry' | 'walking';
  departureTime?: string;
  arrivalTime?: string;
  estimatedDuration: string;
  estimatedCost: number;
  providerHint?: string;
}

export interface TransportAgentOutput {
  routeSummary: string;
  outbound: TransportRouteSegment[];
  inbound?: TransportRouteSegment[];
  localTransitTips?: string[];
  totalTransportCost: number;
}

/**
 * Output of LangGraph Node: activities_food_agent
 */
export interface GastronomicRecommendation {
  dish: string;
  typicalPlace: string;
  description: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  estimatedCost: number;
  dietaryMatch?: boolean;
}

export interface PlannedActivityRecommendation {
  title: string;
  category: string;
  description: string;
  duration: string;
  estimatedCost: number;
  bestTimeOfDay: 'morning' | 'afternoon' | 'evening';
  bookingRequired: boolean;
}

export interface ActivitiesFoodAgentOutput {
  gastronomy: GastronomicRecommendation[];
  activities: PlannedActivityRecommendation[];
  culturalHighlights: string[];
}

/**
 * Input sent to LangGraph Multiagent Orchestrator
 */
export interface AIPlanRecommendationInput {
  userId: string;
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budgetCategory: BudgetCategory;
  currency?: string;
  approximateBudgetAmount?: number;
  psychologicalAssessment: PsychologicalAssessment;
  dietaryRestrictions?: string[];
  preferredStyle?: TravelStyle;
}

/**
 * Standardized Output Contract of LangGraph Engine
 * Directly consumable by ItineraryService & API Gateway Facade
 */
export interface AIPlanRecommendationResult {
  planId: string;
  tripDraft: TripDraft;
  personality: PersonalityAgentOutput;
  budget: BudgetAgentOutput;
  transport: TransportAgentOutput;
  experiences: ActivitiesFoodAgentOutput;
  itinerary: {
    destination: string;
    startDate: string;
    endDate: string;
    days: DayPlan[];
  };
  suggestedBookingItems: CreateBookingItemInput[];
}
