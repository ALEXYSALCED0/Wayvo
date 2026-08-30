/**
 * TripService - Manages Trip Lifecycle, Journey Templates & Trip Aggregations
 * Modular boundary corresponding to the future Trip Microservice
 */
import { ITripRepository } from '../repositories/ITripRepository';
import { Trip, TripTemplate } from '../domain/models/Trip';
import { Event } from '../domain/models/Event';
import { AlternativeOption } from '../domain/models/Alternative';

export class TripService {
  constructor(private repo: ITripRepository) {}

  async getAllTrips(userId?: string): Promise<Trip[]> {
    return this.repo.getAllTrips(userId);
  }

  async getTripById(tripId: string): Promise<Trip> {
    const trip = await this.repo.getTripById(tripId);
    if (!trip) {
      throw new Error(`Trip with id ${tripId} not found`);
    }
    return trip;
  }

  async createTrip(tripData: Omit<Trip, 'id'>): Promise<Trip> {
    const newTrip: Trip = {
      ...tripData,
      id: `trip-custom-${Date.now()}`,
    };
    return this.repo.saveTrip(newTrip);
  }

  async getTemplates(): Promise<TripTemplate[]> {
    return this.repo.getTemplates();
  }

  async getTemplateById(templateId: string): Promise<TripTemplate> {
    const template = await this.repo.getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    return template;
  }

  /**
   * Instantiates a real Trip in the backend from a predefined TripTemplate
   */
  async createTripFromTemplate(templateId: string, userId: string = 'usr-alex-1'): Promise<Trip> {
    const template = await this.getTemplateById(templateId);
    const tripId = `trip-${Date.now()}`;

    const events: Event[] = template.initialEvents.map((e, index) => ({
      ...e,
      id: `event-${tripId}-${index + 1}`,
      tripId,
      order: index + 1,
    }));

    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + template.durationDays);

    const newTrip: Trip = {
      id: tripId,
      userId,
      title: template.title,
      origin: template.origin,
      destination: template.destination,
      startDate: today.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      dates: `${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      status: 'upcoming',
      statusLabel: 'Upcoming',
      travelers: 1,
      progressDays: `Day 0 of ${template.durationDays}`,
      progressPercent: 0,
      imageUrl: template.imageUrl,
      description: template.description,
      events,
    };

    return this.repo.saveTrip(newTrip);
  }

  /**
   * Attaches alternatives to an event inside a trip
   */
  async attachAlternativesToEvent(
    tripId: string,
    eventId: string,
    alternatives: AlternativeOption[]
  ): Promise<Trip> {
    const trip = await this.getTripById(tripId);
    const eventIndex = trip.events.findIndex((e) => e.id === eventId);
    if (eventIndex === -1) {
      throw new Error(`Event ${eventId} not found in trip ${tripId}`);
    }

    trip.events[eventIndex].alternatives = alternatives;
    return this.repo.updateTrip(trip);
  }

  async resetTrips(): Promise<void> {
    await this.repo.resetToInitial();
  }
}
