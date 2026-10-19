import { Event } from './event.dto';
import { AlternativeOption, IssueType } from './incident.dto';
import { Trip } from './trip.dto';

export interface TripMediatorIncidentInput {
  tripId: string;
  eventId: string;
  type: IssueType;
  reason: string;
}

export interface TripMediatorIncidentResult {
  affectedEvent: Event;
  alternatives: AlternativeOption[];
  updatedTrip: Trip;
}

export interface TripMediatorSelectAlternativeInput {
  tripId: string;
  eventId: string;
  alternativeId: string;
}

export interface TripMediatorSelectAlternativeResult {
  selectedAlternative: AlternativeOption;
  updatedTrip: Trip;
}
