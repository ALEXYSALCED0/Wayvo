-- CreateTable
CREATE TABLE "ai_plan_usage" (
    "user_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "used" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ai_plan_usage_pkey" PRIMARY KEY ("user_id","period")
);
