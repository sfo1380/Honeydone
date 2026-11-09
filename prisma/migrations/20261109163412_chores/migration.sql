-- CreateEnum
CREATE TYPE "Effort" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- CreateEnum
CREATE TYPE "Repeat" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY');

-- CreateTable
CREATE TABLE "Chore" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Other',
    "effort" "Effort" NOT NULL DEFAULT 'MEDIUM',
    "ownerId" TEXT,
    "rotate" BOOLEAN NOT NULL DEFAULT false,
    "repeat" "Repeat" NOT NULL DEFAULT 'NONE',
    "interval" INTEGER NOT NULL DEFAULT 1,
    "weekdays" INTEGER[],
    "startDate" DATE NOT NULL,
    "dueTime" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChoreTask" (
    "id" TEXT NOT NULL,
    "choreId" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "dueDate" DATE NOT NULL,
    "assigneeId" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedOn" DATE,
    "completedById" TEXT,
    "onTime" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChoreTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Chore_householdId_archived_idx" ON "Chore"("householdId", "archived");

-- CreateIndex
CREATE INDEX "ChoreTask_householdId_completedAt_dueDate_idx" ON "ChoreTask"("householdId", "completedAt", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "ChoreTask_choreId_dueDate_key" ON "ChoreTask"("choreId", "dueDate");

-- AddForeignKey
ALTER TABLE "Chore" ADD CONSTRAINT "Chore_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chore" ADD CONSTRAINT "Chore_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoreTask" ADD CONSTRAINT "ChoreTask_choreId_fkey" FOREIGN KEY ("choreId") REFERENCES "Chore"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoreTask" ADD CONSTRAINT "ChoreTask_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoreTask" ADD CONSTRAINT "ChoreTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoreTask" ADD CONSTRAINT "ChoreTask_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
