-- 큐미 챗봇 개인정보 동의 플래그: 개인 학습 데이터(점수·일정·진도)를 외부 LLM(OpenAI)
-- 프롬프트에 포함해도 되는지 여부. 기본 false → 동의 전에는 서버 밖으로 개인정보를 보내지 않는다.
ALTER TABLE "User" ADD COLUMN "qmiPersonalConsent" BOOLEAN NOT NULL DEFAULT false;
