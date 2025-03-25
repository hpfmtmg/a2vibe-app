/*
  Warnings:

  - Changed the type of `attendance` on the `Rsvp` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('yes', 'no', 'maybe');

-- DropForeignKey
ALTER TABLE "Rsvp" DROP CONSTRAINT "Rsvp_eventId_fkey";

-- Create a temporary column
ALTER TABLE "Rsvp" ADD COLUMN "attendance_new" "AttendanceStatus";

-- Copy data to the new column, converting values
UPDATE "Rsvp" SET "attendance_new" = 
  CASE 
    WHEN attendance = 'yes' THEN 'yes'::"AttendanceStatus"
    WHEN attendance = 'no' THEN 'no'::"AttendanceStatus"
    ELSE 'maybe'::"AttendanceStatus"
  END;

-- Drop the old column and rename the new one
ALTER TABLE "Rsvp" DROP COLUMN "attendance";
ALTER TABLE "Rsvp" RENAME COLUMN "attendance_new" TO "attendance";

-- Make the column required
ALTER TABLE "Rsvp" ALTER COLUMN "attendance" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Event_date_idx" ON "Event"("date");

-- CreateIndex
CREATE INDEX "Recipe_uploadDate_idx" ON "Recipe"("uploadDate");

-- CreateIndex
CREATE INDEX "Rsvp_eventId_idx" ON "Rsvp"("eventId");

-- CreateIndex
CREATE INDEX "SharedContent_uploadDate_idx" ON "SharedContent"("uploadDate");

-- AddForeignKey
ALTER TABLE "Rsvp" ADD CONSTRAINT "Rsvp_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
