-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "dedupeKey" TEXT,
ADD COLUMN     "leaseId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Notification_dedupeKey_key" ON "Notification"("dedupeKey");
