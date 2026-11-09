-- CreateEnum
CREATE TYPE "EventKind" AS ENUM ('PRACTICE', 'GAME', 'OTHER');

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "kidId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "team" TEXT,
    "coachName" TEXT,
    "coachContact" TEXT,
    "location" TEXT,
    "seasonStart" DATE NOT NULL,
    "seasonEnd" DATE NOT NULL,
    "bringList" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivitySchedule" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "kind" "EventKind" NOT NULL DEFAULT 'PRACTICE',
    "weekdays" INTEGER[],
    "startTime" TEXT NOT NULL,
    "endTime" TEXT,
    "location" TEXT,
    "defaultDropOffId" TEXT,
    "defaultPickUpId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivitySchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityEvent" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "scheduleId" TEXT,
    "slotDate" DATE,
    "customized" BOOLEAN NOT NULL DEFAULT false,
    "kind" "EventKind" NOT NULL DEFAULT 'PRACTICE',
    "title" TEXT,
    "date" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "dropOffId" TEXT,
    "pickUpId" TEXT,
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Activity_householdId_idx" ON "Activity"("householdId");

-- CreateIndex
CREATE INDEX "ActivitySchedule_activityId_idx" ON "ActivitySchedule"("activityId");

-- CreateIndex
CREATE INDEX "ActivityEvent_householdId_date_idx" ON "ActivityEvent"("householdId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityEvent_scheduleId_slotDate_key" ON "ActivityEvent"("scheduleId", "slotDate");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_kidId_fkey" FOREIGN KEY ("kidId") REFERENCES "Kid"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivitySchedule" ADD CONSTRAINT "ActivitySchedule_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ActivitySchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_dropOffId_fkey" FOREIGN KEY ("dropOffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_pickUpId_fkey" FOREIGN KEY ("pickUpId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
