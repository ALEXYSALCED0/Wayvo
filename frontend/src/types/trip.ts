/**
 * Types for Trips, Events, and Detailed Itinerary Timeline
 * Aligned with Backend Domain Models
 */

export type TimelineNodeStatus = 
  | 'completed'      // Green node & line, confirmed/done
  | 'pending'        // Gray node & dashed/solid gray line, upcoming
  | 'in_progress'    // Blue / active
  | 'warning'        // Yellow node, affected by issue / missed
  | 'recalculating'; // Blue node with animation

export type EventTypeEnum = 
  | 'TRANSPORT'
  | 'FLIGHT'
  | 'MEAL'
  | 'MUSEUM'
  | 'TOUR'
  | 'HOTEL'
  | 'ACTIVITY';

export type EventStatusEnum = 
  | 'PENDING'
  | 'COMPLETED'
  | 'ISSUE'
  | 'CANCELLED';

export type ReservationStatusEnum = 
  | 'NOT_RESERVED'
  | 'CONFIRMED';

export interface EventDetails {
  platform?: string;
  seat?: string;
  car?: string;
  bookingRef?: string;
  qrAvailable?: boolean;
  price?: number;
  classType?: string;
  provider?: string;
  notes?: string;
}

export interface Event {
  id: string;
  tripId: string;
  type: EventTypeEnum;
  typeLabel: string;
  title: string;
  description: string;
  location?: string;
  startDateTime?: string;
  endDateTime?: string;
  time: string;
  status: EventStatusEnum;
  statusLabel?: string;
  reservationStatus: ReservationStatusEnum;
  order: number;
  details?: EventDetails;
  isAlternative?: boolean;
  alternativeBadge?: string;
  issueReason?: string;
}

export interface TimelineItem {
  id: string;
  tripId: string;
  title: string;
  description: string;
  time: string;
  type: string;
  typeLabel: string;
  status: TimelineNodeStatus;
  statusLabel?: string;
  location?: string;
  ticket?: EventDetails;
  isExpandable?: boolean;
  isAlternative?: boolean;
  alternativeBadge?: string;
  reservationStatus?: ReservationStatusEnum;
  rawEvent?: Event;
}

export interface Trip {
  id: string;
  userId?: string;
  title: string;
  origin?: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  dates: string;
  status: 'active' | 'upcoming' | 'past';
  statusLabel: string;
  travelers?: number;
  progressDays: string;
  progressPercent: number;
  imageUrl: string;
  description: string;
  events?: Event[];
  timeline?: TimelineItem[];
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
}
