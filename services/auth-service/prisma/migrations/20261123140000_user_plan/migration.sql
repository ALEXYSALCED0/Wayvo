-- CreateEnum
CREATE TYPE "AccountPlan" AS ENUM ('FREE', 'PREMIUM');

-- AlterTable: las cuentas existentes quedan en FREE
ALTER TABLE "users" ADD COLUMN     "plan" "AccountPlan" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "plan_subscription_id" TEXT,
ADD COLUMN     "plan_expires_at" TIMESTAMP(3);
