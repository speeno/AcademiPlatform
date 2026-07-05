-- 토큰 무효화 버전: access/refresh 토큰 payload 의 tv 와 대조한다.
-- 로그아웃·비밀번호 변경 시 이 값을 증가시키면 해당 사용자의 모든 발급 토큰이 즉시 무효화된다.
ALTER TABLE "User" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;
