/**
 * Types for Discover and Future Connections
 */

export interface DiscoverCategory {
  id: string;
  name: string;
  iconName: string;
}

export interface RecommendedDestination {
  id: string;
  title: string;
  location: string;
  matchScore: number;
  description: string;
  imageUrl: string;
  isLarge?: boolean;
}

export interface TrendingExperience {
  id: string;
  title: string;
  location: string;
  rating: number;
  imageUrl: string;
  category: string;
  price?: string;
}

export interface FutureConnectionCardData {
  title: string;
  subtitle: string;
  tag: string;
  description: string;
  memberCount: string;
  iconName: string;
}
