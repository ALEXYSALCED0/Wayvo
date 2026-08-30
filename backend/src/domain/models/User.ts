/**
 * User Domain Model
 */
export interface UserPreferences {
  travelStyle?: string;
  preferredSeating?: string;
  dietaryRequirements?: string;
  currency?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  preferences?: UserPreferences;
}
