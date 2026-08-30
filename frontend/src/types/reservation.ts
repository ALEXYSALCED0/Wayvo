/**
 * Types for Reservation Flow
 */

export interface Passenger {
  id: string;
  name: string;
  type: 'Adult' | 'Child' | 'Infant';
  isLead?: boolean;
}

export interface ReservationDetails {
  id: string;
  itemId: string;
  title: string;
  provider: string;
  transportNumber?: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  passengers: Passenger[];
  classType: string;
  seats: string[];
  baseFare: number;
  taxesAndFees: number;
  seatSelectionFee: number;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'COMMITTED';
  bookingReference?: string;
  imageUrl?: string;
}
