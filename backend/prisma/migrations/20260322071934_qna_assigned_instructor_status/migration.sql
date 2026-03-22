/*
  Warnings:

  - Added the required column `assignedInstructorId` to the `QnaQuestion` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "QnaQuestionStatus" AS ENUM ('OPEN', 'ANSWERED', 'CLOSED');

-- AlterTable
ALTER TABLE "QnaQuestion" ADD COLUMN     "answeredAt" TIMESTAMP(3),
ADD COLUMN     "assignedInstructorId" TEXT NOT NULL,
ADD COLUMN     "status" "QnaQuestionStatus" NOT NULL DEFAULT 'OPEN';

-- CreateIndex
CREATE INDEX "QnaQuestion_assignedInstructorId_status_createdAt_idx" ON "QnaQuestion"("assignedInstructorId", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "QnaQuestion" ADD CONSTRAINT "QnaQuestion_assignedInstructorId_fkey" FOREIGN KEY ("assignedInstructorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
