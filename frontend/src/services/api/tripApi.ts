/**
 * Trip API Service
 * Communicates with backend /api/trips and /api/trip-templates endpoints
 */
import { apiClient } from './apiClient';
import { Trip, TripTemplate } from '../../types/trip';

export const tripApi = {
  async getTrips(userId?: string): Promise<Trip[]> {
    const endpoint = userId ? `trips?userId=${userId}` : 'trips';
    const res = await apiClient.get<Trip[]>(endpoint);
    if (!res.success || !res.data) {
      throw new Error(res.error || 'Failed to fetch trips');
    }
    return res.data;
  },

  async getTripById(tripId: string): Promise<Trip> {
    const res = await apiClient.get<Trip>(`trips/${tripId}`);
    if (!res.success || !res.data) {
      throw new Error(res.error || `Failed to fetch trip ${tripId}`);
    }
    return res.data;
  },

  async getTemplates(): Promise<TripTemplate[]> {
    const res = await apiClient.get<TripTemplate[]>('trip-templates');
    if (!res.success || !res.data) {
      throw new Error(res.error || 'Failed to fetch journey templates');
    }
    return res.data;
  },

  async createTripFromTemplate(templateId: string, userId?: string): Promise<Trip> {
    const res = await apiClient.post<Trip>(`trips/from-template/${templateId}`, { userId });
    if (!res.success || !res.data) {
      throw new Error(res.error || `Failed to create trip from template ${templateId}`);
    }
    return res.data;
  },

  async resetDemo(): Promise<Trip[]> {
    const res = await apiClient.post<Trip[]>('trips/reset-demo');
    if (!res.success || !res.data) {
      throw new Error(res.error || 'Failed to reset demo');
    }
    return res.data;
  },
};
