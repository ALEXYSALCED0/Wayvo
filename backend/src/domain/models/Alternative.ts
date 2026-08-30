/**
 * Alternative Domain Model
 */
import { EventType } from '../enums/EventType';

export interface InjectedEventPreview {
  title: string;
  description: string;
  time: string;
  type: EventType;
  typeLabel: string;
  location?: string;
}

export interface AlternativeOption {
  id: string;
  title: string;
  description: string;
  provider?: string;
  departureTime?: string;
  arrivalTime?: string;
  duration?: string;
  price?: number;
  currency?: string;
  isFastest?: boolean;
  isBestValue?: boolean;
  scoreMatch?: number;
  newEventsToInject: InjectedEventPreview[];
}
