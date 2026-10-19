import { BookingItemType } from '../bookings/booking.dto';

export enum VerificationStatus {
  VERIFIED = 'VERIFIED',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
}

export enum ProviderType {
  TRANSPORT = 'TRANSPORT',
  ACCOMMODATION = 'ACCOMMODATION',
  ACTIVITY = 'ACTIVITY',
  TOUR_GUIDE = 'TOUR_GUIDE',
}

export interface Provider {
  id: string;
  name: string;
  type: ProviderType;
  verificationStatus: VerificationStatus;
  contactEmail: string;
  contactPhone?: string;
  rating?: number;
  websiteUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceOffer {
  id: string;
  providerId: string;
  type: BookingItemType;
  title: string;
  description: string;
  unitPrice: number;
  currency: string;
  availableCapacity: number;
  active: boolean;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}
