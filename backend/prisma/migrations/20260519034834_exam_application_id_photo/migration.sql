-- AlterTable
ALTER TABLE "ExamApplication" ADD COLUMN     "idPhoto" BYTEA,
ADD COLUMN     "idPhotoFileName" TEXT,
ADD COLUMN     "idPhotoMimeType" TEXT,
ADD COLUMN     "idPhotoSize" INTEGER;
