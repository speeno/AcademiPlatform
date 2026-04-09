-- DropForeignKey
ALTER TABLE "ExamApplication" DROP CONSTRAINT "ExamApplication_userId_fkey";

-- AlterTable
ALTER TABLE "ExamApplication" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ExamApplication" ADD CONSTRAINT "ExamApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
