-- 수강신청 승인 대기 상태(PENDING) 추가: 결제 없이 신청→관리자 승인→ACTIVE 플로우 지원
ALTER TYPE "EnrollmentStatus" ADD VALUE IF NOT EXISTS 'PENDING' BEFORE 'ACTIVE';
