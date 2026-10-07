import { z } from 'zod';
import { EventStatus, EventType, ReservationStatus } from './event.dto';
import { IssueType } from './incident.dto';
import { TripStatus } from './trip.dto';

export const tripStatusSchema = z.nativeEnum(TripStatus);
export const eventTypeSchema = z.nativeEnum(EventType);
export const eventStatusSchema = z.nativeEnum(EventStatus);
export const reservationStatusSchema = z.nativeEnum(ReservationStatus);
export const issueTypeSchema = z.nativeEnum(IssueType);

export const eventDetailsSchema = z.object({
  platform: z.string().optional(),
  seat: z.string().optional(),
  car: z.string().optional(),
  bookingRef: z.string().optional(),
  qrAvailable: z.boolean().optional(),
  price: z.number().nonnegative().optional(),
  classType: z.string().optional(),
  provider: z.string().optional(),
  confirmationCode: z.string().optional(),
  notes: z.string().optional(),
});

export const injectedEventPreviewSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  time: z.string().min(1),
  type: eventTypeSchema,
  typeLabel: z.string().optional(),
  location: z.string().optional(),
});

export const alternativeOptionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  type: z.string().optional(),
  typeLabel: z.string().optional(),
  provider: z.string().optional(),
  departureTime: z.string().optional(),
  arrivalTime: z.string().optional(),
  duration: z.string().optional(),
  price: z.number().nonnegative().optional(),
  currency: z.string().optional(),
  isFastest: z.boolean().optional(),
  isBestValue: z.boolean().optional(),
  isRecommended: z.boolean().optional(),
  scoreMatch: z.number().min(0).max(100).optional(),
  newEventsToInject: z.array(injectedEventPreviewSchema).default([]),
});

export const eventSchema = z.object({
  id: z.string().min(1),
  tripId: z.string().min(1),
  type: eventTypeSchema,
  typeLabel: z.string().optional(),
  title: z.string().min(1),
  description: z.string().default(''),
  location: z.string().optional(),
  startDateTime: z.string().min(1),
  endDateTime: z.string().optional(),
  time: z.string().min(1),
  status: eventStatusSchema.default(EventStatus.PENDING),
  statusLabel: z.string().optional(),
  reservationStatus: reservationStatusSchema.default(ReservationStatus.NOT_RESERVED),
  order: z.number().int(),
  details: eventDetailsSchema.optional(),
  isAlternative: z.boolean().optional(),
  alternativeBadge: z.string().optional(),
  alternatives: z.array(alternativeOptionSchema).optional(),
  issueReason: z.string().optional(),
});

export const tripDraftSchema = z.object({
  userId: z.string().min(1),
  destination: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  origin: z.string().optional(),
  title: z.string().optional(),
  travelers: z.number().int().positive().optional(),
});

export const createTripSchema = z.object({
  userId: z.string().min(1),
  destination: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  origin: z.string().optional(),
  title: z.string().optional(),
  travelers: z.number().int().positive().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().or(z.string().min(1)).optional(),
  status: tripStatusSchema.optional().default(TripStatus.PENDING),
  events: z.array(eventSchema.omit({ id: true, tripId: true })).optional(),
});

export const updateTripSchema = z.object({
  title: z.string().optional(),
  status: tripStatusSchema.optional(),
  statusLabel: z.string().optional(),
  origin: z.string().optional(),
  destination: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  travelers: z.number().int().positive().optional(),
  imageUrl: z.string().optional(),
  description: z.string().optional(),
});

export const cancelTripSchema = z.object({
  reason: z.string().min(1).default('Cancelled by user or saga compensation'),
});

export const reportIncidentSchema = z.object({
  tripId: z.string().min(1),
  eventId: z.string().min(1),
  type: issueTypeSchema,
  reason: z.string().min(1),
});

export const selectAlternativeSchema = z.object({
  tripId: z.string().min(1),
  eventId: z.string().min(1),
  alternativeId: z.string().min(1),
});
