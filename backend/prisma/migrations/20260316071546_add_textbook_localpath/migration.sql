-- AlterTable
ALTER TABLE "Textbook" ADD COLUMN     "localPath" TEXT,
ALTER COLUMN "s3Key" DROP NOT NULL;
