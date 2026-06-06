CREATE TYPE "ExamMode" AS ENUM ('OFFLINE', 'ONLINE', 'HYBRID');
CREATE TYPE "ExamEligibilityStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "QuestionType" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'SHORT_TEXT', 'FILE_SUBMISSION');
CREATE TYPE "QuestionDifficulty" AS ENUM ('EASY', 'NORMAL', 'HARD');
CREATE TYPE "ExamPaperStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "ExamAttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'AUTO_GRADED', 'MANUAL_GRADING', 'GRADED', 'INVALIDATED');
CREATE TYPE "ExamAnswerStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'AUTO_GRADED', 'MANUAL_GRADED');
CREATE TYPE "ExamResultStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED', 'INVALIDATED');
CREATE TYPE "ExamProctorEventType" AS ENUM ('HEARTBEAT', 'HEARTBEAT_MISSED', 'TAB_BLUR', 'WINDOW_FOCUS_LOST', 'FULLSCREEN_EXIT', 'COPY_ATTEMPT', 'PASTE_ATTEMPT', 'CONTEXT_MENU', 'WEBCAM_PERMISSION_DENIED', 'WEBCAM_SNAPSHOT', 'NETWORK_RECONNECT', 'FORCE_SUBMIT');

ALTER TABLE "ExamSession"
ADD COLUMN "examMode" "ExamMode" NOT NULL DEFAULT 'OFFLINE',
ADD COLUMN "examWindowStart" TIMESTAMP(3),
ADD COLUMN "examWindowEnd" TIMESTAMP(3),
ADD COLUMN "durationMinutes" INTEGER,
ADD COLUMN "lateEntryMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "requireFullscreen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "requireWebcam" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "passingScore" INTEGER NOT NULL DEFAULT 60;

ALTER TABLE "ExamApplication"
ADD COLUMN "examEligibility" "ExamEligibilityStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "approvedAt" TIMESTAMP(3),
ADD COLUMN "approvedById" TEXT;

CREATE TABLE "QuestionBank" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "qualificationName" TEXT,
  "subject" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "QuestionBank_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Question" (
  "id" TEXT NOT NULL,
  "bankId" TEXT NOT NULL,
  "type" "QuestionType" NOT NULL,
  "difficulty" "QuestionDifficulty" NOT NULL DEFAULT 'NORMAL',
  "prompt" TEXT NOT NULL,
  "explanation" TEXT,
  "points" INTEGER NOT NULL DEFAULT 1,
  "tags" TEXT[] NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuestionOption" (
  "id" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuestionAnswerKey" (
  "id" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "optionId" TEXT,
  "textPattern" TEXT,
  "points" INTEGER NOT NULL DEFAULT 1,
  "explanation" TEXT,
  CONSTRAINT "QuestionAnswerKey_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamPaper" (
  "id" TEXT NOT NULL,
  "examSessionId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "ExamPaperStatus" NOT NULL DEFAULT 'DRAFT',
  "totalPoints" INTEGER NOT NULL DEFAULT 0,
  "shuffleQuestions" BOOLEAN NOT NULL DEFAULT true,
  "shuffleOptions" BOOLEAN NOT NULL DEFAULT true,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExamPaper_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamPaperSection" (
  "id" TEXT NOT NULL,
  "paperId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ExamPaperSection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamPaperItem" (
  "id" TEXT NOT NULL,
  "paperId" TEXT NOT NULL,
  "sectionId" TEXT,
  "questionId" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "points" INTEGER NOT NULL DEFAULT 1,
  "required" BOOLEAN NOT NULL DEFAULT true,
  "scoringPolicy" JSONB,
  CONSTRAINT "ExamPaperItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamAttempt" (
  "id" TEXT NOT NULL,
  "examSessionId" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "paperId" TEXT NOT NULL,
  "status" "ExamAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "submittedAt" TIMESTAMP(3),
  "lastHeartbeatAt" TIMESTAMP(3),
  "questionOrder" TEXT[] NOT NULL,
  "warningCount" INTEGER NOT NULL DEFAULT 0,
  "invalidatedReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExamAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamAnswer" (
  "id" TEXT NOT NULL,
  "attemptId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "selectedOptionIds" TEXT[] NOT NULL,
  "textAnswer" TEXT,
  "fileUrl" TEXT,
  "fileName" TEXT,
  "answerJson" JSONB,
  "questionSnapshot" JSONB,
  "optionsSnapshot" JSONB,
  "pointsSnapshot" INTEGER NOT NULL DEFAULT 0,
  "score" INTEGER,
  "feedback" TEXT,
  "status" "ExamAnswerStatus" NOT NULL DEFAULT 'DRAFT',
  "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "submittedAt" TIMESTAMP(3),
  "gradedAt" TIMESTAMP(3),
  "gradedById" TEXT,
  CONSTRAINT "ExamAnswer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamResult" (
  "id" TEXT NOT NULL,
  "attemptId" TEXT NOT NULL,
  "totalScore" INTEGER NOT NULL DEFAULT 0,
  "maxScore" INTEGER NOT NULL DEFAULT 0,
  "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" "ExamResultStatus" NOT NULL DEFAULT 'PENDING',
  "feedback" TEXT,
  "publishedAt" TIMESTAMP(3),
  "publishedById" TEXT,
  "emailSentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExamResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamProctorEvent" (
  "id" TEXT NOT NULL,
  "attemptId" TEXT NOT NULL,
  "type" "ExamProctorEventType" NOT NULL,
  "payload" JSONB,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExamProctorEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamProctorSnapshot" (
  "id" TEXT NOT NULL,
  "attemptId" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileName" TEXT,
  "mimeType" TEXT,
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExamProctorSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ExamApplication_examEligibility_idx" ON "ExamApplication"("examEligibility");
CREATE INDEX "QuestionBank_qualificationName_subject_idx" ON "QuestionBank"("qualificationName", "subject");
CREATE INDEX "QuestionBank_isActive_idx" ON "QuestionBank"("isActive");
CREATE INDEX "Question_bankId_type_isActive_idx" ON "Question"("bankId", "type", "isActive");
CREATE INDEX "Question_difficulty_idx" ON "Question"("difficulty");
CREATE INDEX "QuestionOption_questionId_order_idx" ON "QuestionOption"("questionId", "order");
CREATE INDEX "QuestionAnswerKey_questionId_idx" ON "QuestionAnswerKey"("questionId");
CREATE INDEX "ExamPaper_examSessionId_status_idx" ON "ExamPaper"("examSessionId", "status");
CREATE INDEX "ExamPaperSection_paperId_order_idx" ON "ExamPaperSection"("paperId", "order");
CREATE UNIQUE INDEX "ExamPaperItem_paperId_questionId_key" ON "ExamPaperItem"("paperId", "questionId");
CREATE INDEX "ExamPaperItem_paperId_order_idx" ON "ExamPaperItem"("paperId", "order");
CREATE INDEX "ExamPaperItem_questionId_idx" ON "ExamPaperItem"("questionId");
CREATE UNIQUE INDEX "ExamAttempt_applicationId_key" ON "ExamAttempt"("applicationId");
CREATE INDEX "ExamAttempt_examSessionId_status_idx" ON "ExamAttempt"("examSessionId", "status");
CREATE INDEX "ExamAttempt_userId_status_idx" ON "ExamAttempt"("userId", "status");
CREATE INDEX "ExamAttempt_expiresAt_idx" ON "ExamAttempt"("expiresAt");
CREATE UNIQUE INDEX "ExamAnswer_attemptId_questionId_key" ON "ExamAnswer"("attemptId", "questionId");
CREATE INDEX "ExamAnswer_questionId_idx" ON "ExamAnswer"("questionId");
CREATE INDEX "ExamAnswer_status_idx" ON "ExamAnswer"("status");
CREATE UNIQUE INDEX "ExamResult_attemptId_key" ON "ExamResult"("attemptId");
CREATE INDEX "ExamResult_status_idx" ON "ExamResult"("status");
CREATE INDEX "ExamResult_publishedAt_idx" ON "ExamResult"("publishedAt");
CREATE INDEX "ExamProctorEvent_attemptId_occurredAt_idx" ON "ExamProctorEvent"("attemptId", "occurredAt");
CREATE INDEX "ExamProctorEvent_type_occurredAt_idx" ON "ExamProctorEvent"("type", "occurredAt");
CREATE INDEX "ExamProctorSnapshot_attemptId_capturedAt_idx" ON "ExamProctorSnapshot"("attemptId", "capturedAt");

ALTER TABLE "ExamApplication" ADD CONSTRAINT "ExamApplication_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Question" ADD CONSTRAINT "Question_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "QuestionBank"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuestionAnswerKey" ADD CONSTRAINT "QuestionAnswerKey_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamPaper" ADD CONSTRAINT "ExamPaper_examSessionId_fkey" FOREIGN KEY ("examSessionId") REFERENCES "ExamSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamPaperSection" ADD CONSTRAINT "ExamPaperSection_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "ExamPaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamPaperItem" ADD CONSTRAINT "ExamPaperItem_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "ExamPaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamPaperItem" ADD CONSTRAINT "ExamPaperItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ExamPaperSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExamPaperItem" ADD CONSTRAINT "ExamPaperItem_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_examSessionId_fkey" FOREIGN KEY ("examSessionId") REFERENCES "ExamSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ExamApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "ExamPaper"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExamAnswer" ADD CONSTRAINT "ExamAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ExamAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamAnswer" ADD CONSTRAINT "ExamAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExamAnswer" ADD CONSTRAINT "ExamAnswer_gradedById_fkey" FOREIGN KEY ("gradedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExamResult" ADD CONSTRAINT "ExamResult_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ExamAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamResult" ADD CONSTRAINT "ExamResult_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExamProctorEvent" ADD CONSTRAINT "ExamProctorEvent_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ExamAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamProctorSnapshot" ADD CONSTRAINT "ExamProctorSnapshot_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ExamAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
