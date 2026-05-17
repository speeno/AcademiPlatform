# AcademiQ — Agent Harness 포인터

이 저장소의 Cursor 에이전트·Task 파이프라인 진입점입니다. Harness 100 전체 트리는 스캔하지 않고, 아래 에이전트 정의만 사용합니다.

## 트리거 (언제 쓸지)

| 요청 유형 | 에이전트 |
|-----------|----------|
| 결제·수강·환불·PortOne·JWT 부팅·P0 보안 | [`agents/security-payment.md`](agents/security-payment.md) |
| API base·`fetchWithAuth`·인증·프론트 SSR | [`agents/frontend-api-auth.md`](agents/frontend-api-auth.md) |
| 단위/E2E·GitHub Actions·Render 체크 | [`agents/test-ci.md`](agents/test-ci.md) |

## 실행 순서 (권장)

1. **감사** — `explore` 서브에이전트로 P0 목록 수집 (파일:라인)
2. **구현** — `security-payment` 또는 `frontend-api-auth` 범위에 맞게 수정
3. **검증** — `test-ci`: `backend/npm run test:all`, `frontend/npm run build`
4. **PR** — 변경이 크면 `split-to-prs` 스킬, CI 유지는 `babysit` 스킬

## Harness 100 이식 (로컬 클론 있을 때)

```bash
python scripts/import_harness_case.py --lang ko --case <케이스명> --out /path/to/AcademiPlatform
```

케이스 목록: 로컬 `~/harness/harness-100/ko/harness-100-cases.md`

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-05-17 | 최초 포인터 — security-payment, frontend-api-auth, test-ci |
