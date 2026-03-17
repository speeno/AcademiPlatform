-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'INSTRUCTOR', 'OPERATOR', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DORMANT', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'UPCOMING', 'ACTIVE', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'REVIEWING', 'SCHEDULED', 'PUBLISHED', 'HIDDEN', 'ENDED');

-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('VIDEO_YOUTUBE', 'VIDEO_UPLOAD', 'DOCUMENT', 'TEXT', 'LIVE_LINK', 'QUIZ');

-- CreateEnum
CREATE TYPE "EncodingStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "DrmType" AS ENUM ('NONE', 'AES128', 'PALLYCON');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "AssignmentSubmissionStatus" AS ENUM ('PENDING', 'SUBMITTED', 'REVIEWING', 'FEEDBACK_DONE');

-- CreateEnum
CREATE TYPE "ExamSessionStatus" AS ENUM ('UPCOMING', 'OPEN', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExamApplicationStatus" AS ENUM ('TEMP_SAVED', 'PAYMENT_PENDING', 'APPLIED', 'CANCELLED', 'REFUND_REQUESTED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentTarget" AS ENUM ('ENROLLMENT', 'EXAM_APPLICATION', 'TEXTBOOK');

-- CreateEnum
CREATE TYPE "TextbookStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TextbookGrantedBy" AS ENUM ('ENROLLMENT', 'PURCHASE', 'ADMIN');

-- CreateEnum
CREATE TYPE "NoticeScope" AS ENUM ('GLOBAL', 'COURSE');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'CLOSED');

-- CreateEnum
CREATE TYPE "IntroPageStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'HIDDEN', 'SCHEDULED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "phone" TEXT,
    "birthDate" TIMESTAMP(3),
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "mfaSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntroPage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImage" TEXT,
    "status" "IntroPageStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntroPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntroPageSection" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "sectionType" TEXT NOT NULL,
    "title" TEXT,
    "contentJson" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntroPageSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "summary" TEXT,
    "thumbnailUrl" TEXT,
    "price" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT,
    "tags" TEXT[],
    "instructorId" TEXT NOT NULL,
    "enrollmentStartAt" TIMESTAMP(3),
    "enrollmentEndAt" TIMESTAMP(3),
    "learningPeriodDays" INTEGER,
    "maxCapacity" INTEGER,
    "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseModule" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "moduleId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "lessonType" "LessonType" NOT NULL,
    "contentStatus" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "isPreview" BOOLEAN NOT NULL DEFAULT false,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "releaseAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "prerequisiteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonVideoAsset" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "youtubeUrl" TEXT,
    "videoFileUrl" TEXT,
    "hlsPlaylistUrl" TEXT,
    "s3OriginalKey" TEXT,
    "aesKeyId" TEXT,
    "thumbnailUrl" TEXT,
    "durationSeconds" INTEGER,
    "subtitleUrl" TEXT,
    "embedEnabled" BOOLEAN NOT NULL DEFAULT true,
    "encodingStatus" "EncodingStatus" NOT NULL DEFAULT 'PENDING',
    "drmType" "DrmType" NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonVideoAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonDocument" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonVersion" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "versionNo" INTEGER NOT NULL,
    "changeNote" TEXT,
    "snapshotJson" JSONB NOT NULL,
    "publishedBy" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoPlaySession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastPingAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiredAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoPlaySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "progressRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentId" TEXT,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "watchedSeconds" INTEGER NOT NULL DEFAULT 0,
    "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueAt" TIMESTAMP(3),
    "allowResubmit" BOOLEAN NOT NULL DEFAULT false,
    "allowLateSubmit" BOOLEAN NOT NULL DEFAULT false,
    "maxFileSizeMb" INTEGER NOT NULL DEFAULT 50,
    "allowedFileTypes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentSubmission" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "textAnswer" TEXT,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "status" "AssignmentSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "feedback" TEXT,
    "feedbackAt" TIMESTAMP(3),

    CONSTRAINT "AssignmentSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamSession" (
    "id" TEXT NOT NULL,
    "qualificationName" TEXT NOT NULL,
    "roundName" TEXT NOT NULL,
    "applyStartAt" TIMESTAMP(3) NOT NULL,
    "applyEndAt" TIMESTAMP(3) NOT NULL,
    "examAt" TIMESTAMP(3) NOT NULL,
    "place" TEXT,
    "fee" INTEGER NOT NULL DEFAULT 0,
    "capacity" INTEGER,
    "status" "ExamSessionStatus" NOT NULL DEFAULT 'UPCOMING',
    "guidanceHtml" TEXT,
    "relatedCourseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamApplication" (
    "id" TEXT NOT NULL,
    "examSessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ExamApplicationStatus" NOT NULL DEFAULT 'TEMP_SAVED',
    "formJson" JSONB NOT NULL,
    "paymentId" TEXT,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetType" "PaymentTarget" NOT NULL,
    "targetId" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "pgProvider" TEXT,
    "pgTxId" TEXT,
    "paidAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Textbook" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "coverImageUrl" TEXT,
    "s3Key" TEXT NOT NULL,
    "totalPages" INTEGER,
    "price" INTEGER NOT NULL DEFAULT 0,
    "isStandalone" BOOLEAN NOT NULL DEFAULT false,
    "status" "TextbookStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Textbook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseTextbook" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "textbookId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "autoGrantOnEnroll" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CourseTextbook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TextbookAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "textbookId" TEXT NOT NULL,
    "grantedBy" "TextbookGrantedBy" NOT NULL,
    "sourceId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "TextbookAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TextbookViewLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "textbookId" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TextbookViewLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notice" (
    "id" TEXT NOT NULL,
    "scopeType" "NoticeScope" NOT NULL DEFAULT 'GLOBAL',
    "scopeId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faq" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QnaQuestion" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QnaQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QnaAnswer" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QnaAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "fileUrl" TEXT,
    "status" "InquiryStatus" NOT NULL DEFAULT 'OPEN',
    "response" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "detail" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "IntroPage_slug_key" ON "IntroPage"("slug");

-- CreateIndex
CREATE INDEX "IntroPage_slug_status_idx" ON "IntroPage"("slug", "status");

-- CreateIndex
CREATE INDEX "IntroPageSection_pageId_sortOrder_idx" ON "IntroPageSection"("pageId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");

-- CreateIndex
CREATE INDEX "Course_slug_idx" ON "Course"("slug");

-- CreateIndex
CREATE INDEX "Course_status_category_idx" ON "Course"("status", "category");

-- CreateIndex
CREATE INDEX "CourseModule_courseId_sortOrder_idx" ON "CourseModule"("courseId", "sortOrder");

-- CreateIndex
CREATE INDEX "Lesson_courseId_sortOrder_idx" ON "Lesson"("courseId", "sortOrder");

-- CreateIndex
CREATE INDEX "Lesson_moduleId_idx" ON "Lesson"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonVideoAsset_lessonId_key" ON "LessonVideoAsset"("lessonId");

-- CreateIndex
CREATE INDEX "LessonVersion_lessonId_versionNo_idx" ON "LessonVersion"("lessonId", "versionNo");

-- CreateIndex
CREATE UNIQUE INDEX "VideoPlaySession_sessionToken_key" ON "VideoPlaySession"("sessionToken");

-- CreateIndex
CREATE INDEX "VideoPlaySession_userId_lessonId_idx" ON "VideoPlaySession"("userId", "lessonId");

-- CreateIndex
CREATE INDEX "VideoPlaySession_sessionToken_idx" ON "VideoPlaySession"("sessionToken");

-- CreateIndex
CREATE INDEX "Enrollment_userId_status_idx" ON "Enrollment"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_userId_courseId_key" ON "Enrollment"("userId", "courseId");

-- CreateIndex
CREATE INDEX "LessonProgress_userId_idx" ON "LessonProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonProgress_userId_lessonId_key" ON "LessonProgress"("userId", "lessonId");

-- CreateIndex
CREATE INDEX "AssignmentSubmission_assignmentId_userId_idx" ON "AssignmentSubmission"("assignmentId", "userId");

-- CreateIndex
CREATE INDEX "ExamApplication_examSessionId_status_idx" ON "ExamApplication"("examSessionId", "status");

-- CreateIndex
CREATE INDEX "ExamApplication_userId_idx" ON "ExamApplication"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_orderNo_key" ON "Payment"("orderNo");

-- CreateIndex
CREATE INDEX "Payment_userId_paymentStatus_idx" ON "Payment"("userId", "paymentStatus");

-- CreateIndex
CREATE INDEX "Payment_orderNo_idx" ON "Payment"("orderNo");

-- CreateIndex
CREATE UNIQUE INDEX "CourseTextbook_courseId_textbookId_key" ON "CourseTextbook"("courseId", "textbookId");

-- CreateIndex
CREATE INDEX "TextbookAccess_userId_textbookId_idx" ON "TextbookAccess"("userId", "textbookId");

-- CreateIndex
CREATE UNIQUE INDEX "TextbookAccess_userId_textbookId_key" ON "TextbookAccess"("userId", "textbookId");

-- CreateIndex
CREATE INDEX "TextbookViewLog_userId_textbookId_idx" ON "TextbookViewLog"("userId", "textbookId");

-- CreateIndex
CREATE INDEX "TextbookViewLog_textbookId_viewedAt_idx" ON "TextbookViewLog"("textbookId", "viewedAt");

-- CreateIndex
CREATE INDEX "Notice_scopeType_scopeId_isPinned_idx" ON "Notice"("scopeType", "scopeId", "isPinned");

-- CreateIndex
CREATE INDEX "QnaQuestion_courseId_createdAt_idx" ON "QnaQuestion"("courseId", "createdAt");

-- CreateIndex
CREATE INDEX "Inquiry_userId_status_idx" ON "Inquiry"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "IntroPageSection" ADD CONSTRAINT "IntroPageSection_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "IntroPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseModule" ADD CONSTRAINT "CourseModule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "CourseModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonVideoAsset" ADD CONSTRAINT "LessonVideoAsset_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonDocument" ADD CONSTRAINT "LessonDocument_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonVersion" ADD CONSTRAINT "LessonVersion_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoPlaySession" ADD CONSTRAINT "VideoPlaySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSubmission" ADD CONSTRAINT "AssignmentSubmission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSubmission" ADD CONSTRAINT "AssignmentSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamApplication" ADD CONSTRAINT "ExamApplication_examSessionId_fkey" FOREIGN KEY ("examSessionId") REFERENCES "ExamSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamApplication" ADD CONSTRAINT "ExamApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Textbook" ADD CONSTRAINT "Textbook_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseTextbook" ADD CONSTRAINT "CourseTextbook_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseTextbook" ADD CONSTRAINT "CourseTextbook_textbookId_fkey" FOREIGN KEY ("textbookId") REFERENCES "Textbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextbookAccess" ADD CONSTRAINT "TextbookAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextbookAccess" ADD CONSTRAINT "TextbookAccess_textbookId_fkey" FOREIGN KEY ("textbookId") REFERENCES "Textbook"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextbookViewLog" ADD CONSTRAINT "TextbookViewLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextbookViewLog" ADD CONSTRAINT "TextbookViewLog_textbookId_fkey" FOREIGN KEY ("textbookId") REFERENCES "Textbook"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QnaQuestion" ADD CONSTRAINT "QnaQuestion_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QnaQuestion" ADD CONSTRAINT "QnaQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QnaAnswer" ADD CONSTRAINT "QnaAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QnaQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QnaAnswer" ADD CONSTRAINT "QnaAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
