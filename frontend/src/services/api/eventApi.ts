/**
 * Event API Service
 * Communicates with backend /api/trips/:tripId/events endpoints and triggers Mediator flows
 */
import { apiClient } from './apiClient';
import { Event } from '../../types/trip';
import { AlternativeOption } from '../../types/issue';

export interface ReportIssueResponse {
  affectedEvent: Event;
  alternatives: AlternativeOption[];
  trip: any;
}

export interface SelectAlternativeResponse {
  selectedAlternative: AlternativeOption;
  trip: any;
}

export const eventApi = {
  async getEvents(tripId: string): Promise<Event[]> {
    const res = await apiClient.get<Event[]>(`trips/${tripId}/events`);
    if (!res.success || !res.data) {
      throw new Error(res.error || `Failed to fetch events for trip ${tripId}`);
    }
    return res.data;
  },

  async getEventById(tripId: string, eventId: string): Promise<Event> {
    const res = await apiClient.get<Event>(`trips/${tripId}/events/${eventId}`);
    if (!res.success || !res.data) {
      throw new Error(res.error || `Failed to fetch event ${eventId}`);
    }
    return res.data;
  },

  /**
   * Confirms reservation on backend: reservationStatus -> CONFIRMED (status remains PENDING)
   */
  async reserveEvent(tripId: string, eventId: string): Promise<Event> {
    const res = await apiClient.post<Event>(`trips/${tripId}/events/${eventId}/reserve`);
    if (!res.success || !res.data) {
      throw new Error(res.error || 'Failed to confirm reservation');
    }
    return res.data;
  },

  /**
   * Manually completes event on backend: status -> COMPLETED (locks event)
   */
  async completeEvent(tripId: string, eventId: string): Promise<Event> {
    const res = await apiClient.post<Event>(`trips/${tripId}/events/${eventId}/complete`);
    if (!res.success || !res.data) {
      throw new Error(res.error || 'Failed to complete event');
    }
    return res.data;
  },

  /**
   * Dispatches issue to backend TripMediator
   */
  async reportIssue(
    tripId: string,
    eventId: string,
    issueType: string,
    reason?: string
  ): Promise<ReportIssueResponse> {
    const res = await apiClient.post<ReportIssueResponse>(
      `trips/${tripId}/events/${eventId}/report-issue`,
      { type: issueType, reason }
    );
    if (!res.success || !res.data) {
      throw new Error(res.error || 'Failed to process issue through Mediator');
    }
    return res.data;
  },

  async getAlternatives(tripId: string, eventId: string): Promise<AlternativeOption[]> {
    const res = await apiClient.get<AlternativeOption[]>(
      `trips/${tripId}/events/${eventId}/alternatives`
    );
    if (!res.success || !res.data) {
      throw new Error(res.error || 'Failed to fetch alternatives');
    }
    return res.data;
  },

  /**
   * Dispatches alternative selection to backend TripMediator
   */
  async selectAlternative(
    tripId: string,
    eventId: string,
    alternativeId: string
  ): Promise<SelectAlternativeResponse> {
    const res = await apiClient.post<SelectAlternativeResponse>(
      `trips/${tripId}/events/${eventId}/alternatives/${alternativeId}/select`
    );
    if (!res.success || !res.data) {
      throw new Error(res.error || 'Failed to select alternative through Mediator');
    }
    return res.data;
  },
};
