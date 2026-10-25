/*
  Warnings:

  - The `processingStatus` column on the `TicketAIAnalysis` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "AIProcessingStatus" AS ENUM ('PENDING', 'DONE', 'FAILED', 'COMPLETED');

-- AlterTable
ALTER TABLE "SupportTicket" ADD COLUMN     "categoryOverridden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priorityOverridden" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TicketAIAnalysis" DROP COLUMN "processingStatus",
ADD COLUMN     "processingStatus" "AIProcessingStatus" NOT NULL DEFAULT 'PENDING';
