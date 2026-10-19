/**
 * @wayvo/contracts - Main Entry Point
 * Canonical contract definitions, DTOs, interfaces, and schemas for Wayvo Platform
 */

// Common contracts (API envelope, Correlation, Errors)
export * from './common';

// Trips domain contracts (Dev 4 - Mediator, Itinerary, Incidents)
export * from './trips';

// Bookings domain contracts (Dev 1 - Saga, Booking, Compensation)
export * from './bookings';

// Profiles & AI domain contracts (Dev 4 & Dev 2 - LangGraph, User Profiles, Onboarding)
export * from './profiles';

// Providers domain contracts (Dev 3 - Adapter, External Providers, Mock API)
export * from './providers';

// API Gateway Facade contracts (Dev 2 - Facade, Aggregated Endpoints)
export * from './gateway';
