/**
 * Trip Service (Mock layer)
 * Designed for clean substitution with real REST / GraphQL / Mediator API endpoints
 */

import { Trip, TimelineItem } from '../types/trip';
import { mockTrips, initialTimeline } from '../data/mockData';

class TripService {
  private trips: Trip[] = [...mockTrips];
  private timeline: TimelineItem[] = [...initialTimeline];

  async getActiveTrip(): Promise<Trip> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const active = this.trips.find((t) => t.status === 'active') || this.trips[0];
    return { ...active, timeline: [...this.timeline] };
  }

  async getAllTrips(): Promise<Trip[]> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return this.trips.map((t) => ({ ...t, timeline: [...this.timeline] }));
  }

  async getTimeline(tripId: string): Promise<TimelineItem[]> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return [...this.timeline];
  }

  async updateTimeline(newTimeline: TimelineItem[]): Promise<TimelineItem[]> {
    this.timeline = [...newTimeline];
    return [...this.timeline];
  }

  async resetTimeline(): Promise<TimelineItem[]> {
    this.timeline = [...initialTimeline];
    return [...this.timeline];
  }
}

export const tripService = new TripService();
