import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contractsDir = path.resolve(__dirname, '..');

// Import compiled dist code
import {
  createTripSchema,
  createBookingSchema,
  confirmTripSagaSchema,
  onboardingProfileSchema,
  checkAvailabilityRequestSchema,
  confirmProviderReservationRequestSchema,
  TripStatus,
  BookingStatus,
  BookingItemType,
  SagaStep,
  CORRELATION_ID_HEADER,
} from '../dist/index.js';

test('Contracts - Constants and Enums', () => {
  assert.equal(CORRELATION_ID_HEADER, 'x-correlation-id');
  assert.equal(TripStatus.PENDING, 'PENDING');
  assert.equal(BookingStatus.CONFIRMED, 'CONFIRMED');
  assert.equal(BookingItemType.TRANSPORT, 'TRANSPORT');
  assert.equal(SagaStep.CREATE_BOOKING, 'CREATE_BOOKING');
});

test('Contracts - Validation Schemas (Zod)', () => {
  // 1. Trip Schema
  const validTrip = {
    userId: 'usr-1',
    destination: 'Cartagena, Colombia',
    startDate: '2026-11-01',
    endDate: '2026-11-08',
    travelers: 2,
    status: TripStatus.PENDING,
  };
  const parsedTrip = createTripSchema.parse(validTrip);
  assert.equal(parsedTrip.destination, 'Cartagena, Colombia');

  // 2. Booking Schema
  const validBooking = {
    tripId: 'trip-1',
    userId: 'usr-1',
    currency: 'COP',
    items: [
      {
        type: BookingItemType.TRANSPORT,
        providerId: 'prov-avianca',
        offerId: 'offer-bog-ctg',
        description: 'Vuelo directo Bogotá - Cartagena',
        quantity: 2,
        unitPrice: 250000,
      },
    ],
  };
  const parsedBooking = createBookingSchema.parse(validBooking);
  assert.equal(parsedBooking.items.length, 1);
  assert.equal(parsedBooking.items[0].unitPrice, 250000);

  // 3. Saga Schema
  const validSaga = {
    userId: 'usr-1',
    currency: 'COP',
    trip: {
      destination: 'Santa Marta',
      startDate: '2026-12-01',
      endDate: '2026-12-05',
    },
    items: validBooking.items,
  };
  const parsedSaga = confirmTripSagaSchema.parse(validSaga);
  assert.equal(parsedSaga.trip.destination, 'Santa Marta');

  // 4. Onboarding / Profile Schema
  const validProfile = {
    origin: 'Bogotá',
    destination: 'Medellín',
    startDate: '2026-11-10',
    endDate: '2026-11-15',
    travelers: 1,
    budgetCategory: 'Estándar',
    psychologicalAssessment: {
      spontaneityScore: 3,
      comfortPriority: 4,
      culturalCuriosity: 5,
      socialPreference: 'solo',
      physicalActivityLevel: 'moderate',
      interests: ['cafeterías', 'museos'],
    },
  };
  const parsedProfile = onboardingProfileSchema.parse(validProfile);
  assert.equal(parsedProfile.destination, 'Medellín');

  // 5. Provider Availability & Confirmation Schemas
  const validAvailabilityReq = {
    items: [
      {
        type: BookingItemType.ACCOMMODATION,
        providerId: 'prov-hotel-1',
        offerId: 'room-deluxe',
        quantity: 1,
      },
    ],
  };
  const parsedAvailability = checkAvailabilityRequestSchema.parse(validAvailabilityReq);
  assert.equal(parsedAvailability.items[0].offerId, 'room-deluxe');

  const validConfirmReq = {
    bookingId: 'book-123',
    items: validAvailabilityReq.items,
  };
  const parsedConfirm = confirmProviderReservationRequestSchema.parse(validConfirmReq);
  assert.equal(parsedConfirm.bookingId, 'book-123');
});

test('Contracts - Standalone JSON Schemas Integrity', () => {
  const jsonDir = path.join(contractsDir, 'schemas', 'json');
  const files = fs.readdirSync(jsonDir).filter((f) => f.endsWith('.schema.json'));

  assert.ok(files.length >= 5, 'Should have at least 5 JSON schema files');

  for (const file of files) {
    const raw = fs.readFileSync(path.join(jsonDir, file), 'utf8');
    const schema = JSON.parse(raw);
    assert.ok(schema.$schema, `${file} must specify $schema`);
    assert.ok(schema.title, `${file} must specify title`);
    assert.ok(schema.definitions, `${file} must contain definitions`);
  }
});
