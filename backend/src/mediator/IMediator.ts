/**
 * IMediator - GoF Mediator Pattern Contract
 * Defines the communication interface to coordinate distributed services without direct coupling
 */
import { Trip } from '../domain/models/Trip';
import { Event } from '../domain/models/Event';
import { AlternativeOption } from '../domain/models/Alternative';
import { IssueType } from '../domain/enums/IssueType';

export interface IssueReportResult {
  updatedTrip: Trip;
  affectedEvent: Event;
  alternatives: AlternativeOption[];
}

export interface AlternativeSelectResult {
  updatedTrip: Trip;
  selectedAlternative: AlternativeOption;
}

export interface IMediator {
  notify(sender: object, eventName: string, data?: any): Promise<any>;

  handleIssueReport(
    tripId: string,
    eventId: string,
    issueType: IssueType,
    reason?: string
  ): Promise<IssueReportResult>;

  handleAlternativeSelection(
    tripId: string,
    eventId: string,
    alternativeId: string
  ): Promise<AlternativeSelectResult>;
}
