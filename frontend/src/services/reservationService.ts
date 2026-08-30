/**
 * Reservation Service (Mock Layer)
 * Handles transport and activity booking confirmations
 */

import { ReservationDetails } from '../types/reservation';
import { mockReservationDetails } from '../data/mockData';

class ReservationService {
  private currentReservation: ReservationDetails = { ...mockReservationDetails };

  async getReservationDetails(itemId: string): Promise<ReservationDetails> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return { ...this.currentReservation, itemId };
  }

  async confirmBooking(reservationId: string): Promise<{ success: boolean; bookingRef: string }> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    this.currentReservation.status = 'COMMITTED';
    const bookingRef = `WAY-CONF-${Math.floor(100000 + Math.random() * 900000)}`;
    this.currentReservation.bookingReference = bookingRef;
    return { success: true, bookingRef };
  }
}

export const reservationService = new ReservationService();
