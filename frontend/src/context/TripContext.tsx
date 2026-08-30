/**
 * TripContext - Global State Management connected to the Express + TypeScript Backend
 * Manages Trips Collection, Active Trip, Events, Lifecycles, and Mediator Disruption Flows
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Trip, TimelineItem, TripTemplate, Event, EventStatusEnum } from '../types/trip';
import { TimelinePhase, AlternativeOption } from '../types/issue';
import { tripApi } from '../services/api/tripApi';
import { eventApi } from '../services/api/eventApi';

interface TripContextType {
  trips: Trip[];
  activeTrip: Trip | null;
  timeline: TimelineItem[];
  templates: TripTemplate[];
  phase: TimelinePhase;
  affectedItemId: string | null;
  activeIssueType: string | null;
  alternatives: AlternativeOption[];
  selectedAlternative: AlternativeOption | null;
  isRecalculating: boolean;
  recalculatingMessage: string;
  isLoading: boolean;
  errorMessage: string | null;
  loadTrips: (preserveActiveTripId?: string) => Promise<void>;
  selectTrip: (tripId: string) => Promise<void>;
  createTripFromTemplate: (templateId: string) => Promise<Trip>;
  reportIssue: (eventId: string, issueType: string, reason?: string) => Promise<void>;
  selectAlternative: (alt: AlternativeOption) => void;
  applySelectedAlternative: () => Promise<void>;
  confirmReservation: (eventId: string) => Promise<{ success: boolean; bookingRef: string }>;
  completeEvent: (eventId: string) => Promise<{ success: boolean }>;
  resetDemo: () => Promise<void>;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

// Helper to convert backend Event to UI TimelineItem
export const mapEventToTimelineItem = (event: Event): TimelineItem => {
  let status: TimelineItem['status'] = 'pending';

  if (event.status === 'COMPLETED') {
    status = 'completed';
  } else if (event.status === 'ISSUE') {
    status = 'warning';
  } else {
    status = 'pending';
  }

  return {
    id: event.id,
    tripId: event.tripId,
    title: event.title,
    description: event.description,
    time: event.time,
    type: event.type.toLowerCase(),
    typeLabel: event.typeLabel || event.type,
    status,
    statusLabel: event.statusLabel || (event.status === 'COMPLETED' ? 'Completed' : event.reservationStatus === 'CONFIRMED' ? 'Confirmed' : 'Upcoming'),
    location: event.location,
    ticket: event.details,
    isExpandable: !!event.details,
    isAlternative: event.isAlternative,
    alternativeBadge: event.alternativeBadge,
    reservationStatus: event.reservationStatus,
    rawEvent: event,
  };
};

export const TripProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [templates, setTemplates] = useState<TripTemplate[]>([]);
  const [phase, setPhase] = useState<TimelinePhase>('normal');
  const [affectedItemId, setAffectedItemId] = useState<string | null>(null);
  const [activeIssueType, setActiveIssueType] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<AlternativeOption[]>([]);
  const [selectedAlternative, setSelectedAlternative] = useState<AlternativeOption | null>(null);
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);
  const [recalculatingMessage, setRecalculatingMessage] = useState<string>('Wayvo is recalculating your route...');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadTrips = async (preserveActiveTripId?: string) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const [fetchedTrips, fetchedTemplates] = await Promise.all([
        tripApi.getTrips(),
        tripApi.getTemplates().catch(() => []),
      ]);

      setTrips(fetchedTrips);
      setTemplates(fetchedTemplates);

      // Determine which trip should be active
      const targetId = preserveActiveTripId || activeTrip?.id || 'trip-euro-1';
      const targetTrip = fetchedTrips.find((t) => t.id === targetId) || fetchedTrips[0];

      if (targetTrip) {
        setActiveTrip(targetTrip);
        const mapped = (targetTrip.events || []).map(mapEventToTimelineItem);
        setTimeline(mapped);
      }
    } catch (err: any) {
      console.warn('[TripProvider] Error loading trips from backend:', err.message);
      setErrorMessage('Wayvo could not connect to the backend server.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectTrip = async (tripId: string) => {
    try {
      setIsLoading(true);
      const trip = await tripApi.getTripById(tripId);
      setActiveTrip(trip);
      const mapped = (trip.events || []).map(mapEventToTimelineItem);
      setTimeline(mapped);
      setPhase('normal');
      setAffectedItemId(null);
      setAlternatives([]);
      setSelectedAlternative(null);

      // Update in trips collection as well
      setTrips((prev) => prev.map((t) => (t.id === tripId ? trip : t)));
    } catch (err: any) {
      console.warn(`[TripProvider] Error selecting trip ${tripId}:`, err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createTripFromTemplate = async (templateId: string): Promise<Trip> => {
    const newTrip = await tripApi.createTripFromTemplate(templateId);
    
    // Refresh all trips from backend
    const fetchedTrips = await tripApi.getTrips();
    setTrips(fetchedTrips);
    setActiveTrip(newTrip);
    setTimeline((newTrip.events || []).map(mapEventToTimelineItem));
    setPhase('normal');
    setAffectedItemId(null);
    setAlternatives([]);
    setSelectedAlternative(null);
    return newTrip;
  };

  useEffect(() => {
    loadTrips();
  }, []);

  /**
   * Mediator Disruption Flow:
   * 1. Updates UI to Recalculating state.
   * 2. Calls backend POST /report-issue (dispatched through TripMediator).
   * 3. Receives tailored alternatives and displays them.
   */
  const reportIssue = async (eventId: string, issueType: string, reason?: string) => {
    if (!activeTrip) return;

    setAffectedItemId(eventId);
    setActiveIssueType(issueType);
    setPhase('recalculating');
    setIsRecalculating(true);

    if (issueType === 'MISSED') {
      setRecalculatingMessage('Wayvo is recalculating your route... Finding alternative options for missed connection.');
    } else if (issueType === 'USER_CHANGED_PLAN') {
      setRecalculatingMessage('Wayvo is extending your itinerary... Reorganizing subsequent activities.');
    } else if (issueType === 'CANCELLED') {
      setRecalculatingMessage('Finding nearby cultural and activity replacements...');
    } else {
      setRecalculatingMessage('Recalculating itinerary based on your preferences...');
    }

    // Set local node to warning status
    setTimeline((prev) =>
      prev.map((item) => {
        if (item.id === eventId) {
          return {
            ...item,
            status: 'warning',
            statusLabel: issueType === 'MISSED' ? 'Missed' : 'Needs Rescheduling',
          };
        }
        return item;
      })
    );

    try {
      // Send to Backend Mediator
      const response = await eventApi.reportIssue(
        activeTrip.id,
        eventId,
        issueType,
        reason
      );

      setAlternatives(response.alternatives);
      if (response.alternatives && response.alternatives.length > 0) {
        setSelectedAlternative(response.alternatives[0]);
      }

      if (response.trip) {
        setActiveTrip(response.trip);
        setTrips((prev) => prev.map((t) => (t.id === response.trip.id ? response.trip : t)));
      }
    } catch (err: any) {
      console.warn('[TripProvider] Error reporting issue:', err.message);
    } finally {
      setIsRecalculating(false);
      setPhase('alternatives_ready');
    }
  };

  const selectAlternative = (alt: AlternativeOption) => {
    setSelectedAlternative(alt);
  };

  /**
   * Apply Alternative Flow:
   * 1. Calls backend POST /alternatives/:id/select (dispatched through TripMediator).
   * 2. Receives updated trip and renders new timeline.
   */
  const applySelectedAlternative = async () => {
    if (!activeTrip || !affectedItemId || !selectedAlternative) return;

    try {
      const response = await eventApi.selectAlternative(
        activeTrip.id,
        affectedItemId,
        selectedAlternative.id
      );

      if (response.trip) {
        setActiveTrip(response.trip);
        setTrips((prev) => prev.map((t) => (t.id === response.trip.id ? response.trip : t)));
        const mapped = (response.trip.events || []).map(mapEventToTimelineItem);
        setTimeline(mapped);
      }
      setPhase('updated');
    } catch (err: any) {
      console.warn('[TripProvider] Error applying alternative:', err.message);
    }
  };

  /**
   * Confirm Reservation:
   * Sets reservationStatus = CONFIRMED in backend. Event status remains PENDING!
   */
  const confirmReservation = async (eventId: string): Promise<{ success: boolean; bookingRef: string }> => {
    if (!activeTrip) return { success: false, bookingRef: '' };

    try {
      const updatedEvent = await eventApi.reserveEvent(activeTrip.id, eventId);
      
      // Update event in activeTrip
      const updatedEvents = (activeTrip.events || []).map((e) =>
        e.id === eventId ? updatedEvent : e
      );
      const updatedTrip = { ...activeTrip, events: updatedEvents };
      setActiveTrip(updatedTrip);
      setTrips((prev) => prev.map((t) => (t.id === activeTrip.id ? updatedTrip : t)));

      setTimeline((prev) =>
        prev.map((item) => {
          if (item.id === eventId) {
            return mapEventToTimelineItem(updatedEvent);
          }
          return item;
        })
      );
      return {
        success: true,
        bookingRef: updatedEvent.details?.bookingRef || 'WAY-9241-EUR',
      };
    } catch (err: any) {
      console.warn('[TripProvider] Error reserving event:', err.message);
      return { success: false, bookingRef: '' };
    }
  };

  /**
   * Complete Event:
   * Sets status = COMPLETED in backend. Locks event against issues!
   */
  const completeEvent = async (eventId: string): Promise<{ success: boolean }> => {
    if (!activeTrip) return { success: false };

    try {
      const updatedEvent = await eventApi.completeEvent(activeTrip.id, eventId);

      // Update event in activeTrip
      const updatedEvents = (activeTrip.events || []).map((e) =>
        e.id === eventId ? updatedEvent : e
      );
      const updatedTrip = { ...activeTrip, events: updatedEvents };
      setActiveTrip(updatedTrip);
      setTrips((prev) => prev.map((t) => (t.id === activeTrip.id ? updatedTrip : t)));

      setTimeline((prev) =>
        prev.map((item) => {
          if (item.id === eventId) {
            return mapEventToTimelineItem(updatedEvent);
          }
          return item;
        })
      );
      return { success: true };
    } catch (err: any) {
      console.warn('[TripProvider] Error completing event:', err.message);
      return { success: false };
    }
  };

  const resetDemo = async () => {
    try {
      setIsLoading(true);
      await tripApi.resetDemo();
      await loadTrips('trip-euro-1');
      setPhase('normal');
      setAffectedItemId(null);
      setActiveIssueType(null);
      setAlternatives([]);
      setSelectedAlternative(null);
      setIsRecalculating(false);
    } catch (err: any) {
      console.warn('[TripProvider] Error resetting demo:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TripContext.Provider
      value={{
        trips,
        activeTrip,
        timeline,
        templates,
        phase,
        affectedItemId,
        activeIssueType,
        alternatives,
        selectedAlternative,
        isRecalculating,
        recalculatingMessage,
        isLoading,
        errorMessage,
        loadTrips,
        selectTrip,
        createTripFromTemplate,
        reportIssue,
        selectAlternative,
        applySelectedAlternative,
        confirmReservation,
        completeEvent,
        resetDemo,
      }}
    >
      {children}
    </TripContext.Provider>
  );
};

export const useTrip = (): TripContextType => {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrip must be used within a TripProvider');
  }
  return context;
};
