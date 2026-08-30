/**
 * InMemoryTripRepository - In-memory implementation of ITripRepository
 * Maintains state during development and presentation demo sessions
 */
import { ITripRepository } from './ITripRepository';
import { Trip, TripTemplate } from '../domain/models/Trip';
import { Event } from '../domain/models/Event';
import { initialTrips, tripTemplates } from '../data/seedData';

export class InMemoryTripRepository implements ITripRepository {
  private trips: Map<string, Trip> = new Map();
  private templates: Map<string, TripTemplate> = new Map();

  constructor() {
    this.seed();
  }

  private seed(): void {
    this.trips.clear();
    this.templates.clear();

    // Deep clone initialTrips so modifications don't corrupt the seed constants
    const clonedTrips: Trip[] = JSON.parse(JSON.stringify(initialTrips));
    for (const trip of clonedTrips) {
      this.trips.set(trip.id, trip);
    }

    const clonedTemplates: TripTemplate[] = JSON.parse(JSON.stringify(tripTemplates));
    for (const template of clonedTemplates) {
      this.templates.set(template.id, template);
    }
  }

  async getAllTrips(userId?: string): Promise<Trip[]> {
    const all = Array.from(this.trips.values());
    if (userId) {
      return all.filter((t) => t.userId === userId);
    }
    return all;
  }

  async getTripById(tripId: string): Promise<Trip | null> {
    const trip = this.trips.get(tripId);
    return trip ? JSON.parse(JSON.stringify(trip)) : null;
  }

  async saveTrip(trip: Trip): Promise<Trip> {
    this.trips.set(trip.id, JSON.parse(JSON.stringify(trip)));
    return JSON.parse(JSON.stringify(trip));
  }

  async updateTrip(trip: Trip): Promise<Trip> {
    this.trips.set(trip.id, JSON.parse(JSON.stringify(trip)));
    return JSON.parse(JSON.stringify(trip));
  }

  async deleteTrip(tripId: string): Promise<boolean> {
    return this.trips.delete(tripId);
  }

  async getEventsByTripId(tripId: string): Promise<Event[]> {
    const trip = this.trips.get(tripId);
    return trip ? JSON.parse(JSON.stringify(trip.events)) : [];
  }

  async getEventById(tripId: string, eventId: string): Promise<Event | null> {
    const trip = this.trips.get(tripId);
    if (!trip) return null;
    const event = trip.events.find((e) => e.id === eventId);
    return event ? JSON.parse(JSON.stringify(event)) : null;
  }

  async updateEvent(tripId: string, updatedEvent: Event): Promise<Event> {
    const trip = this.trips.get(tripId);
    if (!trip) {
      throw new Error(`Trip with id ${tripId} not found`);
    }

    const index = trip.events.findIndex((e) => e.id === updatedEvent.id);
    if (index === -1) {
      throw new Error(`Event with id ${updatedEvent.id} not found in trip ${tripId}`);
    }

    trip.events[index] = JSON.parse(JSON.stringify(updatedEvent));
    this.trips.set(tripId, trip);
    return JSON.parse(JSON.stringify(updatedEvent));
  }

  async addEvent(tripId: string, newEvent: Event): Promise<Event> {
    const trip = this.trips.get(tripId);
    if (!trip) {
      throw new Error(`Trip with id ${tripId} not found`);
    }

    trip.events.push(JSON.parse(JSON.stringify(newEvent)));
    // Keep events sorted by order
    trip.events.sort((a, b) => a.order - b.order);
    this.trips.set(tripId, trip);
    return JSON.parse(JSON.stringify(newEvent));
  }

  async getTemplates(): Promise<TripTemplate[]> {
    return Array.from(this.templates.values());
  }

  async getTemplateById(templateId: string): Promise<TripTemplate | null> {
    const template = this.templates.get(templateId);
    return template ? JSON.parse(JSON.stringify(template)) : null;
  }

  async resetToInitial(): Promise<void> {
    this.seed();
  }
}

export const tripRepository = new InMemoryTripRepository();
