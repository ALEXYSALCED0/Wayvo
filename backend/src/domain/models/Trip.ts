/**
 * Trip and TripTemplate Domain Models
 */
import { Event } from './Event';

export interface Trip {
  id: string;
  userId: string;
  title: string;
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  dates: string;                  // Human-readable (e.g. "Oct 12 - Oct 20, 2024")
  status: 'active' | 'upcoming' | 'past';
  statusLabel: string;
  travelers: number;
  progressDays: string;           // (e.g. "Day 4 of 8")
  progressPercent: number;        // (e.g. 50)
  imageUrl: string;
  description: string;
  events: Event[];
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
  initialEvents: Omit<Event, 'id' | 'tripId'>[];
}
