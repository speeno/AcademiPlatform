-- CreateTable
CREATE TABLE "InstructorPost" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstructorPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InstructorPost_authorId_idx" ON "InstructorPost"("authorId");

-- CreateIndex
CREATE INDEX "InstructorPost_isPinned_createdAt_idx" ON "InstructorPost"("isPinned", "createdAt");

-- AddForeignKey
ALTER TABLE "InstructorPost" ADD CONSTRAINT "InstructorPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
