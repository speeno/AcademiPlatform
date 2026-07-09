-- AlterTable
ALTER TABLE "TrainingProgram" ADD COLUMN     "shareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "TrainingProgram_shareToken_key" ON "TrainingProgram"("shareToken");
