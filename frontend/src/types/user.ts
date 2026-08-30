/**
 * Types for User Profile
 */

export interface UserProfile {
  id: string;
  name: string;
  avatarUrl: string;
  statusTier: string;
  email: string;
  tripsCount: number;
  savedPlacesCount: number;
}
