-- CreateEnum
CREATE TYPE "AwardReason" AS ENUM ('TEAM_GOAL', 'CROWN');

-- AlterTable
ALTER TABLE "Household" ADD COLUMN     "competition" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "competitionSince" DATE,
ADD COLUMN     "teamGoal" INTEGER NOT NULL DEFAULT 80;

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "giverId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Award" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "winnerId" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "reason" "AwardReason" NOT NULL,
    "couponId" TEXT,
    "couponTitle" TEXT,
    "chosenAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Award_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Coupon_householdId_giverId_idx" ON "Coupon"("householdId", "giverId");

-- CreateIndex
CREATE INDEX "Award_householdId_usedAt_idx" ON "Award"("householdId", "usedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Award_householdId_weekStart_winnerId_reason_key" ON "Award"("householdId", "weekStart", "winnerId", "reason");

-- AddForeignKey
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_giverId_fkey" FOREIGN KEY ("giverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Award" ADD CONSTRAINT "Award_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Award" ADD CONSTRAINT "Award_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Award" ADD CONSTRAINT "Award_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
