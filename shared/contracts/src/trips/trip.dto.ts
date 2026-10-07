import { Event } from './event.dto';

export enum TripStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  ACTIVE = 'active',
  UPCOMING = 'upcoming',
  PAST = 'past',
}

export interface TripDraft {
  userId: string;
  destination: string;
  startDate: string; // ISO 8601
  endDate: string;   // ISO 8601
  origin?: string;
  title?: string;
  travelers?: number;
}

export interface CreateTripInput {
  userId: string;
  destination: string;
  startDate: string;
  endDate: string;
  origin?: string;
  title?: string;
  travelers?: number;
  description?: string;
  imageUrl?: string;
  status?: TripStatus;
  events?: Omit<Event, 'id' | 'tripId'>[];
}

export interface UpdateTripInput {
  title?: string;
  status?: TripStatus;
  statusLabel?: string;
  origin?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  travelers?: number;
  imageUrl?: string;
  description?: string;
}

export interface Trip {
  id: string;
  userId: string;
  title: string;
  origin?: string;
  destination: string;
  startDate: string;
  endDate: string;
  dates?: string;                  // Human-readable (e.g. "Oct 12 - Oct 20, 2024")
  status: TripStatus | string;
  statusLabel?: string;
  travelers?: number;
  progressDays?: string;           // (e.g. "Day 4 of 8")
  progressPercent?: number;        // 0 to 100
  imageUrl?: string;
  description?: string;
  events?: Event[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TripTemplate {
  id: string;
  title: string;
  country: string;
  origin: string;
  destination: string;
  durationDays: number;
  subtitle: string;
  description: string;
  imageUrl: string;
  initialEvents?: Omit<Event, 'id' | 'tripId'>[];
}
