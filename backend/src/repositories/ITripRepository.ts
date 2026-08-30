/**
 * ITripRepository - Data Access contract for Trip and Event persistence
 */
import { Trip, TripTemplate } from '../domain/models/Trip';
import { Event } from '../domain/models/Event';

export interface ITripRepository {
  getAllTrips(userId?: string): Promise<Trip[]>;
  getTripById(tripId: string): Promise<Trip | null>;
  saveTrip(trip: Trip): Promise<Trip>;
  updateTrip(trip: Trip): Promise<Trip>;
  deleteTrip(tripId: string): Promise<boolean>;

  getEventsByTripId(tripId: string): Promise<Event[]>;
  getEventById(tripId: string, eventId: string): Promise<Event | null>;
  updateEvent(tripId: string, event: Event): Promise<Event>;
  addEvent(tripId: string, event: Event): Promise<Event>;

  getTemplates(): Promise<TripTemplate[]>;
  getTemplateById(templateId: string): Promise<TripTemplate | null>;
  resetToInitial(): Promise<void>;
}
