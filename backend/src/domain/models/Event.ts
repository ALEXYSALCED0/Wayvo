/**
 * Event Domain Model - Generic timeline item representing any activity, transit, stay, or meal
 */
import { EventType } from '../enums/EventType';
import { EventStatus } from '../enums/EventStatus';
import { ReservationStatus } from '../enums/ReservationStatus';
import { AlternativeOption } from './Alternative';

export interface EventDetails {
  platform?: string;
  seat?: string;
  car?: string;
  bookingRef?: string;
  qrAvailable?: boolean;
  price?: number;
  classType?: string;
  provider?: string;
  confirmationCode?: string;
  notes?: string;
}

export interface Event {
  id: string;
  tripId: string;
  type: EventType;
  typeLabel: string;
  title: string;
  description: string;
  location?: string;
  startDateTime: string;
  endDateTime?: string;
  time: string;                     // Human-readable formatted time (e.g. "14:15 - 17:30")
  status: EventStatus;
  statusLabel?: string;
  reservationStatus: ReservationStatus;
  order: number;
  details?: EventDetails;
  isAlternative?: boolean;
  alternativeBadge?: string;
  alternatives?: AlternativeOption[];
  issueReason?: string;
}
