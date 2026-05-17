# Agent: security-payment

**역할:** AcademiQ 결제·수강·환불·PortOne·JWT/뷰어 시크릿 P0 보안 감사 및 수정.

## 트리거

- `enroll` 결제 우회, `paymentId` 위조, 유료 강의 무료 등록
- 환불 비원자성(PG 실패 후 DB REFUNDED)
- `VIEWER_TOKEN_SECRET` / `changeme` fallback
- 프로덕션 `PORTONE_*`, `DATABASE_URL`, `PAYMENT_DEV_BYPASS`
- PortOne 웹훅 가드·멱등

## 핵심 파일

| 영역 | 경로 |
|------|------|
| 수강 검증 | `backend/src/courses/courses.service.ts` (`enroll`, `assertPaidEnrollmentPayment`) |
| 결제 검증·환불 | `backend/src/payment/payment.service.ts`, `services/portone.client.ts` |
| 후처리 트랜잭션 | `backend/src/payment/services/payment-post-processor.service.ts` |
| 웹훅 | `backend/src/payment/guards/portone-webhook.guard.ts` |
| 부팅 env | `backend/src/config/validate-env.ts` |
| 뷰어 토큰 | `backend/src/textbook/textbook.service.ts` |

## 회귀 테스트 (필수 실행)

```bash
cd backend
JWT_SECRET='test-access-secret-min-32-chars-long!!' \
JWT_REFRESH_SECRET='test-refresh-secret-min-32-chars-long!' \
npm run test:all
```

관련 스펙:

- `backend/test/courses.enroll-payment.spec.ts` · `courses.enroll-payment.e2e-spec.ts`
- `backend/test/payment.refund.spec.ts` · `payment.refund.e2e-spec.ts`
- `backend/test/payment.transaction.e2e-spec.ts`
- `backend/test/portone-webhook.guard.spec.ts`
- `backend/test/validate-env.spec.ts`

## 수정 원칙

1. 유료 판별은 `resolveTargetPricing` / `finalAmount` 스냅샷과 동일 로직 사용.
2. 외부 `POST enroll`은 PAID·본인·ENROLLMENT·courseId·금액 일치 검증 필수.
3. 환불: PG 취소 성공 후에만 `$transaction`으로 DB·권한 회수.
4. 프로덕션에서 bypass·약한 시크릿 금지 — `validateRequiredEnv`와 정합.

## 연계 스킬

- PR 분할: `split-to-prs`
- CI/리뷰 루프: `babysit`
