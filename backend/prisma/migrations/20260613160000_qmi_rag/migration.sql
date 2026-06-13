-- 큐미 RAG: pgvector 확장 + 챗봇 지식 문서 테이블
-- VectorDB 는 별도 서비스 없이 기존 PostgreSQL 의 pgvector 를 사용한다.

-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "chatbot_documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "url" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "roles" TEXT[] DEFAULT ARRAY['public']::TEXT[],
    "pose" TEXT NOT NULL DEFAULT 'explaining',
    "suggestions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chatbot_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chatbot_documents_enabled_idx" ON "chatbot_documents"("enabled");

-- Optional ANN index (pgvector >= 0.5). 소규모 코퍼스에서는 없어도 즉시 검색되며,
-- 문서가 많아지면 성능을 위해 활성화한다.
-- CREATE INDEX "chatbot_documents_embedding_idx"
--   ON "chatbot_documents" USING hnsw ("embedding" vector_cosine_ops);
