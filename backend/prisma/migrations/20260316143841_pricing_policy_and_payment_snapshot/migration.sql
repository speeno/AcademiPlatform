-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('NONE', 'PERCENT', 'FIXED');

-- CreateEnum
CREATE TYPE "PriceTargetType" AS ENUM ('COURSE', 'EXAM_SESSION', 'TEXTBOOK');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "basePrice" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'KRW',
ADD COLUMN     "discountType" "DiscountType" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "discountValue" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pricePolicyVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "priceValidFrom" TIMESTAMP(3),
ADD COLUMN     "priceValidUntil" TIMESTAMP(3),
ADD COLUMN     "salePrice" INTEGER;

-- AlterTable
ALTER TABLE "ExamSession" ADD COLUMN     "basePrice" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'KRW',
ADD COLUMN     "discountType" "DiscountType" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "discountValue" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pricePolicyVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "priceValidFrom" TIMESTAMP(3),
ADD COLUMN     "priceValidUntil" TIMESTAMP(3),
ADD COLUMN     "salePrice" INTEGER;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "baseAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'KRW',
ADD COLUMN     "discountAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "finalAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pricePolicyVersion" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Textbook" ADD COLUMN     "basePrice" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'KRW',
ADD COLUMN     "discountType" "DiscountType" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "discountValue" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pricePolicyVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "priceValidFrom" TIMESTAMP(3),
ADD COLUMN     "priceValidUntil" TIMESTAMP(3),
ADD COLUMN     "salePrice" INTEGER;

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL,
    "targetType" "PriceTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KRW',
    "oldBasePrice" INTEGER,
    "oldSalePrice" INTEGER,
    "oldDiscountType" "DiscountType",
    "oldDiscountValue" INTEGER,
    "oldValidFrom" TIMESTAMP(3),
    "oldValidUntil" TIMESTAMP(3),
    "oldPolicyVersion" INTEGER,
    "newBasePrice" INTEGER,
    "newSalePrice" INTEGER,
    "newDiscountType" "DiscountType",
    "newDiscountValue" INTEGER,
    "newValidFrom" TIMESTAMP(3),
    "newValidUntil" TIMESTAMP(3),
    "newPolicyVersion" INTEGER,
    "reason" TEXT,
    "changedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PriceHistory_targetType_targetId_createdAt_idx" ON "PriceHistory"("targetType", "targetId", "createdAt");

-- CreateIndex
CREATE INDEX "PriceHistory_changedById_createdAt_idx" ON "PriceHistory"("changedById", "createdAt");
