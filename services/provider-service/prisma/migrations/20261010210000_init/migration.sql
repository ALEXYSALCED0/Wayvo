-- CreateEnum
CREATE TYPE "ProviderType" AS ENUM ('TRANSPORT', 'ACCOMMODATION', 'ACTIVITY', 'TOUR_GUIDE');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('VERIFIED', 'PENDING', 'REJECTED');

-- CreateEnum
CREATE TYPE "ServiceOfferType" AS ENUM ('TRANSPORT', 'ACCOMMODATION', 'ACTIVITY');

-- CreateTable
CREATE TABLE "providers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ProviderType" NOT NULL,
    "verification_status" "VerificationStatus" NOT NULL,
    "verification_note" TEXT,
    "contact_email" TEXT NOT NULL,
    "contact_phone" TEXT,
    "rating" DECIMAL(2,1),
    "website_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_offers" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "type" "ServiceOfferType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit_price" DECIMAL(14,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "available_capacity" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "providers_type_verification_status_idx" ON "providers"("type", "verification_status");

-- CreateIndex
CREATE INDEX "service_offers_provider_id_idx" ON "service_offers"("provider_id");

-- CreateIndex
CREATE INDEX "service_offers_type_active_idx" ON "service_offers"("type", "active");

-- AddForeignKey
ALTER TABLE "service_offers" ADD CONSTRAINT "service_offers_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
