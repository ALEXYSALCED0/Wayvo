import { EventType } from './event.dto';

export enum IssueType {
  MISSED = 'MISSED',
  CANCELLED = 'CANCELLED',
  USER_CHANGED_PLAN = 'USER_CHANGED_PLAN',
  UNAVAILABLE = 'UNAVAILABLE',
}

export type IssueScenarioType =
  | 'missed_train'
  | 'stay_longer_rome'
  | 'museum_closed'
  | 'preference_change'
  | 'custom';

export type AlternativeType =
  | 'transit'
  | 'activity'
  | 'accommodation'
  | 'combined'
  | 'flight'
  | 'train'
  | 'bus'
  | 'museum'
  | 'tour'
  | 'meal';

export interface InjectedEventPreview {
  title: string;
  description: string;
  time: string;
  type: EventType;
  typeLabel?: string;
  location?: string;
}

export interface AlternativeOption {
  id: string;
  title: string;
  description: string;
  type?: AlternativeType;
  typeLabel?: string;
  provider?: string;
  departureTime?: string;
  arrivalTime?: string;
  duration?: string;
  price?: number;
  currency?: string;
  isFastest?: boolean;
  isBestValue?: boolean;
  isRecommended?: boolean;
  scoreMatch?: number;
  newEventsToInject: InjectedEventPreview[];
}

export interface ReportIncidentInput {
  tripId: string;
  eventId: string;
  type: IssueType;
  reason: string;
}

export interface SelectAlternativeInput {
  tripId: string;
  eventId: string;
  alternativeId: string;
}
