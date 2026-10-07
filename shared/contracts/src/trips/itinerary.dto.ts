import { Event, EventDetails, ReservationStatus } from './event.dto';

export type TimelineNodeStatus =
  | 'completed'      // Green node & line, confirmed/done
  | 'pending'        // Gray node & dashed/solid gray line, upcoming
  | 'in_progress'    // Blue / active
  | 'warning'        // Yellow node, affected by issue / missed
  | 'recalculating'; // Blue node with animation

export interface DayPlan {
  dayNumber: number;
  date: string; // YYYY-MM-DD
  title?: string;
  events: Event[];
}

export interface Itinerary {
  tripId: string;
  destination: string;
  startDate: string;
  endDate: string;
  days: DayPlan[];
  summary?: string;
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
  reservationStatus?: ReservationStatus;
  rawEvent?: Event;
}
