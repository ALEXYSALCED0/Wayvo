-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('PENDING', 'CONFIRMED', 'ACTIVE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('TRANSPORT', 'FLIGHT', 'MEAL', 'MUSEUM', 'TOUR', 'HOTEL', 'ACTIVITY');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ISSUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('NOT_RESERVED', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "IssueType" AS ENUM ('MISSED', 'CANCELLED', 'USER_CHANGED_PLAN', 'UNAVAILABLE');

-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "origin" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "travelers" INTEGER,
    "description" TEXT,
    "image_url" TEXT,
    "status" "TripStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_events" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "start_date_time" TIMESTAMP(3) NOT NULL,
    "end_date_time" TIMESTAMP(3),
    "location" TEXT,
    "status" "EventStatus" NOT NULL,
    "reservation_status" "ReservationStatus" NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "is_alternative" BOOLEAN NOT NULL DEFAULT false,
    "issue_reason" TEXT,
    "replaced_by_title" TEXT,
    "replaces_event_title" TEXT,
    "details" JSONB,
    "alternatives" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "trip_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "type" "IssueType" NOT NULL,
    "reason" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trips_user_id_created_at_idx" ON "trips"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "trip_events_trip_id_idx" ON "trip_events"("trip_id");

-- CreateIndex
CREATE INDEX "incidents_trip_id_idx" ON "incidents"("trip_id");

-- AddForeignKey
ALTER TABLE "trip_events" ADD CONSTRAINT "trip_events_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

