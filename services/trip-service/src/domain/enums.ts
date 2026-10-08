export enum EventType {
  TRANSPORT = 'TRANSPORT',
  FLIGHT = 'FLIGHT',
  MEAL = 'MEAL',
  MUSEUM = 'MUSEUM',
  TOUR = 'TOUR',
  HOTEL = 'HOTEL',
  ACTIVITY = 'ACTIVITY',
}

export enum EventStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  ISSUE = 'ISSUE',
  CANCELLED = 'CANCELLED',
}

export enum ReservationStatus {
  NOT_RESERVED = 'NOT_RESERVED',
  CONFIRMED = 'CONFIRMED',
}

export enum IssueType {
  MISSED = 'MISSED',
  CANCELLED = 'CANCELLED',
  USER_CHANGED_PLAN = 'USER_CHANGED_PLAN',
  UNAVAILABLE = 'UNAVAILABLE',
}

export enum TripStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export enum AlternativeType {
  TRANSIT = 'transit',
  ACTIVITY = 'activity',
  ACCOMMODATION = 'accommodation',
  COMBINED = 'combined',
  FLIGHT = 'flight',
  TRAIN = 'train',
  BUS = 'bus',
  MUSEUM = 'museum',
  TOUR = 'tour',
  MEAL = 'meal',
}
