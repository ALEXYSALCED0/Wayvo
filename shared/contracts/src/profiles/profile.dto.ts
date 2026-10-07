import { BudgetCategory, PacePreference, PsychologicalAssessment, TravelStyle } from './personality.dto';

export interface UserPreferences {
  travelStyle?: TravelStyle;
  budgetCategory?: BudgetCategory;
  pace?: PacePreference;
  preferredSeating?: string;
  dietaryRequirements?: string;
  currency?: string;
  languages?: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  statusTier?: string;
  preferences?: UserPreferences;
  tripsCount?: number;
  savedPlacesCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface OnboardingProfileInput {
  userId?: string;
  name?: string;
  email?: string;
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
  travelStylePreference?: TravelStyle;
}

export interface UpdateUserProfileInput {
  name?: string;
  avatarUrl?: string;
  preferences?: Partial<UserPreferences>;
}
