-- AlterEnum
ALTER TYPE "CmsContentType" ADD VALUE 'COURSE_PACKAGE';

-- AlterTable
ALTER TABLE "ExamApplication" ADD COLUMN     "referrerCode" TEXT;
