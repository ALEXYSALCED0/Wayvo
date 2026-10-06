-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BookingItemType" AS ENUM ('TRANSPORT', 'ACCOMMODATION', 'ACTIVITY');

-- CreateEnum
CREATE TYPE "SagaStep" AS ENUM ('CREATE_TRIP', 'CREATE_BOOKING', 'RESERVE_PROVIDER', 'CONFIRM', 'COMPENSATE_BOOKING', 'COMPENSATE_TRIP');

-- CreateEnum
CREATE TYPE "StepOutcome" AS ENUM ('SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" "BookingStatus" NOT NULL,
    "cancellation_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_items" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "type" "BookingItemType" NOT NULL,
    "provider_id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "booking_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compensation_logs" (
    "id" TEXT NOT NULL,
    "correlation_id" TEXT NOT NULL,
    "trip_id" TEXT,
    "booking_id" TEXT,
    "failed_step" "SagaStep" NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compensation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compensation_log_entries" (
    "id" SERIAL NOT NULL,
    "log_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "step" "SagaStep" NOT NULL,
    "outcome" "StepOutcome" NOT NULL,
    "detail" TEXT,
    "at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compensation_log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bookings_trip_id_idx" ON "bookings"("trip_id");

-- CreateIndex
CREATE UNIQUE INDEX "compensation_logs_correlation_id_key" ON "compensation_logs"("correlation_id");

-- CreateIndex
CREATE UNIQUE INDEX "compensation_log_entries_log_id_position_key" ON "compensation_log_entries"("log_id", "position");

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compensation_log_entries" ADD CONSTRAINT "compensation_log_entries_log_id_fkey" FOREIGN KEY ("log_id") REFERENCES "compensation_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
