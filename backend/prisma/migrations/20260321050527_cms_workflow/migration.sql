-- CreateEnum
CREATE TYPE "BookVoucherCodeStatus" AS ENUM ('AVAILABLE', 'ASSIGNED', 'USED');

-- CreateEnum
CREATE TYPE "CmsContentType" AS ENUM ('VIDEO_MP4', 'VIDEO_YOUTUBE', 'DOCUMENT', 'HTML');

-- CreateEnum
CREATE TYPE "CmsContentStatus" AS ENUM ('DRAFT', 'REVIEW_REQUESTED', 'REJECTED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CmsCollaboratorRole" AS ENUM ('EDITOR', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "CmsReviewStatus" AS ENUM ('REVIEW_REQUESTED', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "cmsOwnerId" TEXT;

-- CreateTable
CREATE TABLE "CourseCmsCollaborator" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CmsCollaboratorRole" NOT NULL DEFAULT 'EDITOR',
    "grantedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseCmsCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "contentType" "CmsContentType" NOT NULL,
    "status" "CmsContentStatus" NOT NULL DEFAULT 'DRAFT',
    "latestVersionNo" INTEGER NOT NULL DEFAULT 0,
    "publishedVersionNo" INTEGER,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentVersion" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "versionNo" INTEGER NOT NULL,
    "schemaJson" JSONB NOT NULL,
    "changeNote" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentAsset" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "versionId" TEXT,
    "assetType" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageKey" TEXT,
    "publicUrl" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "metaJson" JSONB,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentReviewRequest" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "versionId" TEXT,
    "requestedById" TEXT NOT NULL,
    "status" "CmsReviewStatus" NOT NULL DEFAULT 'REVIEW_REQUESTED',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentReviewRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentAuditLog" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookVoucherCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'BUKIO',
    "courseId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookVoucherCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookVoucherCode" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "BookVoucherCodeStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookVoucherCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookVoucherGrant" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "codeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT,
    "enrollmentId" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "BookVoucherGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseCmsCollaborator_userId_createdAt_idx" ON "CourseCmsCollaborator"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CourseCmsCollaborator_courseId_userId_key" ON "CourseCmsCollaborator"("courseId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentItem_lessonId_key" ON "ContentItem"("lessonId");

-- CreateIndex
CREATE INDEX "ContentItem_courseId_status_idx" ON "ContentItem"("courseId", "status");

-- CreateIndex
CREATE INDEX "ContentVersion_itemId_createdAt_idx" ON "ContentVersion"("itemId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContentVersion_itemId_versionNo_key" ON "ContentVersion"("itemId", "versionNo");

-- CreateIndex
CREATE INDEX "ContentAsset_itemId_createdAt_idx" ON "ContentAsset"("itemId", "createdAt");

-- CreateIndex
CREATE INDEX "ContentReviewRequest_status_createdAt_idx" ON "ContentReviewRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ContentReviewRequest_itemId_createdAt_idx" ON "ContentReviewRequest"("itemId", "createdAt");

-- CreateIndex
CREATE INDEX "ContentAuditLog_itemId_createdAt_idx" ON "ContentAuditLog"("itemId", "createdAt");

-- CreateIndex
CREATE INDEX "ContentAuditLog_action_createdAt_idx" ON "ContentAuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "BookVoucherCampaign_courseId_isActive_idx" ON "BookVoucherCampaign"("courseId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "BookVoucherCode_code_key" ON "BookVoucherCode"("code");

-- CreateIndex
CREATE INDEX "BookVoucherCode_campaignId_status_idx" ON "BookVoucherCode"("campaignId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BookVoucherGrant_codeId_key" ON "BookVoucherGrant"("codeId");

-- CreateIndex
CREATE INDEX "BookVoucherGrant_userId_grantedAt_idx" ON "BookVoucherGrant"("userId", "grantedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BookVoucherGrant_userId_campaignId_key" ON "BookVoucherGrant"("userId", "campaignId");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_cmsOwnerId_fkey" FOREIGN KEY ("cmsOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseCmsCollaborator" ADD CONSTRAINT "CourseCmsCollaborator_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseCmsCollaborator" ADD CONSTRAINT "CourseCmsCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseCmsCollaborator" ADD CONSTRAINT "CourseCmsCollaborator_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentVersion" ADD CONSTRAINT "ContentVersion_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentVersion" ADD CONSTRAINT "ContentVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAsset" ADD CONSTRAINT "ContentAsset_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAsset" ADD CONSTRAINT "ContentAsset_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ContentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAsset" ADD CONSTRAINT "ContentAsset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReviewRequest" ADD CONSTRAINT "ContentReviewRequest_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReviewRequest" ADD CONSTRAINT "ContentReviewRequest_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ContentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReviewRequest" ADD CONSTRAINT "ContentReviewRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReviewRequest" ADD CONSTRAINT "ContentReviewRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAuditLog" ADD CONSTRAINT "ContentAuditLog_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAuditLog" ADD CONSTRAINT "ContentAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookVoucherCampaign" ADD CONSTRAINT "BookVoucherCampaign_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookVoucherCode" ADD CONSTRAINT "BookVoucherCode_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "BookVoucherCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookVoucherGrant" ADD CONSTRAINT "BookVoucherGrant_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "BookVoucherCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookVoucherGrant" ADD CONSTRAINT "BookVoucherGrant_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "BookVoucherCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookVoucherGrant" ADD CONSTRAINT "BookVoucherGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookVoucherGrant" ADD CONSTRAINT "BookVoucherGrant_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
