/**
 * EventService - Manages Event Lifecycle (Reservation, Completion, Issue marking)
 * Modular boundary corresponding to the future Event Microservice
 */
import { ITripRepository } from '../repositories/ITripRepository';
import { Event } from '../domain/models/Event';
import { EventStatus } from '../domain/enums/EventStatus';
import { ReservationStatus } from '../domain/enums/ReservationStatus';
import { IssueType } from '../domain/enums/IssueType';
import { AlternativeOption } from '../domain/models/Alternative';

export class EventService {
  constructor(private repo: ITripRepository) {}

  async getEvent(tripId: string, eventId: string): Promise<Event> {
    const event = await this.repo.getEventById(tripId, eventId);
    if (!event) {
      throw new Error(`Event ${eventId} not found in trip ${tripId}`);
    }
    return event;
  }

  /**
   * Confirm booking for an event.
   * One-time action: reservationStatus becomes CONFIRMED, status remains PENDING.
   * Rejects if already CONFIRMED, COMPLETED, or in ISSUE state.
   */
  async reserveEvent(tripId: string, eventId: string): Promise<Event> {
    const event = await this.getEvent(tripId, eventId);

    if (event.status === EventStatus.COMPLETED) {
      throw new Error(`Cannot reserve an event that is already COMPLETED`);
    }

    if (event.status === EventStatus.ISSUE) {
      throw new Error(`Cannot reserve an event that has an active ISSUE`);
    }

    if (event.reservationStatus === ReservationStatus.CONFIRMED) {
      throw new Error(`Event reservation/payment is already CONFIRMED`);
    }

    event.reservationStatus = ReservationStatus.CONFIRMED;
    if (!event.details) {
      event.details = {};
    }
    if (!event.details.bookingRef) {
      event.details.bookingRef = `WAY-${Math.floor(1000 + Math.random() * 9000)}-RES`;
    }

    return this.repo.updateEvent(tripId, event);
  }

  /**
   * Explicitly marks an event as completed.
   * Locked against any future issue/recalculation modifications.
   */
  async completeEvent(tripId: string, eventId: string): Promise<Event> {
    const event = await this.getEvent(tripId, eventId);

    if (event.status === EventStatus.COMPLETED) {
      throw new Error(`Event is already COMPLETED and finalized`);
    }

    if (event.status === EventStatus.ISSUE) {
      throw new Error(`Cannot complete an event that has an active/unresolved ISSUE`);
    }

    event.status = EventStatus.COMPLETED;
    event.statusLabel = 'Completed';
    return this.repo.updateEvent(tripId, event);
  }

  /**
   * Marks an event as affected by an issue.
   * Locked: Rejects if event is already COMPLETED or already in ISSUE state.
   */
  async markEventAsIssue(
    tripId: string,
    eventId: string,
    issueType: IssueType,
    reason?: string
  ): Promise<Event> {
    const event = await this.getEvent(tripId, eventId);

    if (event.status === EventStatus.COMPLETED) {
      throw new Error(`Cannot report an issue on an event that is already COMPLETED`);
    }

    if (event.status === EventStatus.ISSUE) {
      throw new Error(`Event is already in ISSUE state and cannot be reported again`);
    }

    event.status = EventStatus.ISSUE;
    event.statusLabel = issueType === IssueType.MISSED ? 'Missed' : 'Needs Rescheduling';
    event.issueReason = reason || `Reported ${issueType.toLowerCase().replace('_', ' ')}`;

    return this.repo.updateEvent(tripId, event);
  }

  /**
   * Applies selected alternative by updating the affected event and injecting the new route events.
   * New alternative starts with reservationStatus: NOT_RESERVED and status: PENDING so user can pay & complete it.
   */
  async applyAlternative(
    tripId: string,
    affectedEventId: string,
    alternative: AlternativeOption
  ): Promise<Event[]> {
    const trip = await this.repo.getTripById(tripId);
    if (!trip) {
      throw new Error(`Trip ${tripId} not found`);
    }

    const affectedIndex = trip.events.findIndex((e) => e.id === affectedEventId);
    if (affectedIndex === -1) {
      throw new Error(`Event ${affectedEventId} not found in trip ${tripId}`);
    }

    const affectedEvent = trip.events[affectedIndex];

    // Mark previous affected event as replaced/warning and lock it
    affectedEvent.status = EventStatus.ISSUE;
    affectedEvent.statusLabel = 'Missed / Replaced';
    await this.repo.updateEvent(tripId, affectedEvent);

    // Inject new events from the selected alternative right after the affected event
    let insertIndex = affectedIndex + 1;
    const baseOrder = affectedEvent.order;

    for (let i = 0; i < alternative.newEventsToInject.length; i++) {
      const preview = alternative.newEventsToInject[i];
      const newEvent: Event = {
        id: `node-injected-${Date.now()}-${i}`,
        tripId,
        type: preview.type,
        typeLabel: preview.typeLabel,
        title: preview.title,
        description: preview.description,
        location: preview.location || affectedEvent.location,
        startDateTime: affectedEvent.startDateTime,
        time: preview.time,
        status: EventStatus.PENDING,
        statusLabel: 'Upcoming',
        reservationStatus: ReservationStatus.NOT_RESERVED,
        order: baseOrder + (i + 1) * 0.1,
        isAlternative: true,
        alternativeBadge: 'ITINERARY CHANGED',
        details: {
          provider: alternative.provider,
          bookingRef: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
          price: alternative.price,
        },
      };

      trip.events.splice(insertIndex, 0, newEvent);
      insertIndex++;
    }

    // Re-normalize order numbers
    trip.events.forEach((e, idx) => {
      e.order = idx + 1;
    });

    await this.repo.updateTrip(trip);
    return trip.events;
  }
}
