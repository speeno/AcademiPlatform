# Agent: test-ci

**역할:** 백엔드 단위/E2E·프론트 빌드·GitHub Actions CI 유지 및 실패 원인 분석.

## 트리거

- PR CI 실패, `npm test` / `test:e2e` / `next build` 오류
- enroll·환불·refresh 회귀 테스트 추가
- Render 배포 전 로컬 검증

## CI 워크플로

- [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — PR/push 시 backend test + frontend build
- [`.github/workflows/render-keepalive.yml`](../.github/workflows/render-keepalive.yml) — Render 헬스 ping (별도)

## 로컬 명령

```bash
# 백엔드 전체
cd backend
export JWT_SECRET='test-access-secret-min-32-chars-long!!'
export JWT_REFRESH_SECRET='test-refresh-secret-min-32-chars-long!'
npm run test:all   # unit + e2e

# 프론트 빌드
cd frontend
NEXT_PUBLIC_API_URL=http://localhost:4400/api npm run build
```

## E2E 스펙 맵 (P3)

| 스펙 | 목적 |
|------|------|
| `test/auth.refresh.e2e-spec.ts` | 만료 access + 유효 refresh |
| `test/courses.enroll-payment.e2e-spec.ts` | HTTP enroll 결제 검증 |
| `test/payment.refund.e2e-spec.ts` | HTTP 환불 원자성 |
| `test/payment.transaction.e2e-spec.ts` | verify 후처리 실패 시 PAID 미커밋 |

헬퍼: `test/helpers/e2e-env.ts`, `test/helpers/http-e2e.helper.ts` (Nest 11: `createTestingModule({ imports })`).

## Render 체크리스트

- `DEPLOY.md`, `render.yaml` — `start:render`, env (`JWT_*`, `PORTONE_WEBHOOK_SECRET`, `DATABASE_URL`)

## 연계 스킬

- CI 실패 조사: Task `ci-investigator`
- PR 머지 준비: `babysit`
