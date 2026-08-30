/**
 * EventStatus - Lifecycle state of an itinerary event
 */
export enum EventStatus {
  PENDING = 'PENDING',       // Upcoming/scheduled, not yet finalized
  COMPLETED = 'COMPLETED',   // Explicitly finalized/attended; locked against issue modifications
  ISSUE = 'ISSUE',           // Affected by an unexpected disruption (missed, cancelled, etc.)
  CANCELLED = 'CANCELLED',   // Cancelled or replaced
}
