/**
 * TripMediator - Concrete GoF Mediator Implementation
 * Coordinates TripService, EventService, and AlternativeService
 * Prevents services from tightly coupling to each other during complex recalculation workflows
 */
import { IMediator, IssueReportResult, AlternativeSelectResult } from './IMediator';
import { TripService } from '../services/TripService';
import { EventService } from '../services/EventService';
import { AlternativeService } from '../services/AlternativeService';
import { IssueType } from '../domain/enums/IssueType';
import { AlternativeOption } from '../domain/models/Alternative';

export class TripMediator implements IMediator {
  constructor(
    private tripService: TripService,
    private eventService: EventService,
    private alternativeService: AlternativeService
  ) {}

  /**
   * Generic Mediator notification dispatch
   */
  async notify(sender: object, eventName: string, data?: any): Promise<any> {
    switch (eventName) {
      case 'EVENT_ISSUE_REPORTED':
        return this.handleIssueReport(
          data.tripId,
          data.eventId,
          data.issueType,
          data.reason
        );

      case 'ALTERNATIVE_SELECTED':
        return this.handleAlternativeSelection(
          data.tripId,
          data.eventId,
          data.alternativeId
        );

      default:
        console.warn(`[TripMediator] Unhandled mediator event: ${eventName}`);
        return null;
    }
  }

  /**
   * Main Mediator Flow for Disruptions:
   * 1. Tells EventService to mark event as ISSUE (fails if already COMPLETED).
   * 2. Tells AlternativeService to generate tailored alternative options.
   * 3. Tells TripService to store/attach alternatives on the trip timeline.
   * 4. Returns coordinated result to the Controller -> Frontend.
   */
  async handleIssueReport(
    tripId: string,
    eventId: string,
    issueType: IssueType,
    reason?: string
  ): Promise<IssueReportResult> {
    console.log(`[TripMediator] Coordinating issue report for Trip: ${tripId}, Event: ${eventId}, Issue: ${issueType}`);

    // Step 1: Transition event state via EventService
    const affectedEvent = await this.eventService.markEventAsIssue(
      tripId,
      eventId,
      issueType,
      reason
    );

    // Step 2: Generate alternatives via AlternativeService
    const alternatives: AlternativeOption[] = this.alternativeService.generateAlternatives(
      affectedEvent,
      issueType,
      reason
    );

    // Step 3: Attach alternatives to trip via TripService
    const updatedTrip = await this.tripService.attachAlternativesToEvent(
      tripId,
      eventId,
      alternatives
    );

    console.log(`[TripMediator] Coordinated ${alternatives.length} alternatives for event ${eventId}`);

    return {
      updatedTrip,
      affectedEvent,
      alternatives,
    };
  }

  /**
   * Mediator Flow for Alternative Selection:
   * 1. Finds the selected alternative.
   * 2. Coordinates with EventService to apply alternative nodes and mark issue node as replaced.
   * 3. Retrieves updated Trip from TripService.
   */
  async handleAlternativeSelection(
    tripId: string,
    eventId: string,
    alternativeId: string
  ): Promise<AlternativeSelectResult> {
    console.log(`[TripMediator] Coordinating alternative selection: ${alternativeId} for Event: ${eventId}`);

    const event = await this.eventService.getEvent(tripId, eventId);

    // If alternatives not on event, re-generate them from AlternativeService
    let alternatives = event.alternatives;
    if (!alternatives || alternatives.length === 0) {
      alternatives = this.alternativeService.generateAlternatives(
        event,
        (event.issueReason as IssueType) || IssueType.MISSED
      );
    }

    const selectedAlternative = alternatives.find((a) => a.id === alternativeId) || alternatives[0];

    if (!selectedAlternative) {
      throw new Error(`Alternative ${alternativeId} not found`);
    }

    // Apply alternative via EventService
    await this.eventService.applyAlternative(tripId, eventId, selectedAlternative);

    // Retrieve fresh trip via TripService
    const updatedTrip = await this.tripService.getTripById(tripId);

    console.log(`[TripMediator] Successfully applied alternative ${selectedAlternative.id} to Trip ${tripId}`);

    return {
      updatedTrip,
      selectedAlternative,
    };
  }
}
