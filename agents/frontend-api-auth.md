# Agent: frontend-api-auth

**역할:** Next.js 프론트의 API base 통일, 인증 헤더·refresh·쿠키 정책, SSR/클라이언트 fetch 일관성.

## 트리거

- `NEXT_PUBLIC_API_URL` / `getServerApiBase()` 중복·불일치
- `fetchWithAuth` 미연결, `localStorage` 직접 접근 분산
- middleware 쿠키 vs `lib/auth.ts` localStorage 이중
- admin/mypage/classroom API 호출 401·base URL 오류
- `force-dynamic` / `revalidate` 혼용

## 핵심 파일

| 영역 | 경로 |
|------|------|
| API base | `frontend/lib/api-base.ts`, `frontend/lib/api-client.ts`(있으면) |
| 인증 | `frontend/lib/auth.ts`, `frontend/middleware.ts` |
| SSR 예시 | `frontend/app/(public)/exam/**`, `faq/**` |
| 결제 클라이언트 | `frontend/lib/payment.ts` |
| 레이아웃 dynamic | `frontend/app/(public)/layout.tsx` |

## 백엔드 계약 (참고)

- 글로벌 prefix: `/api`
- Refresh: `POST /api/auth/refresh` body `{ refreshToken }`
- Access: `Authorization: Bearer` 또는 `accessToken` 쿠키

## 검증

```bash
cd frontend
NEXT_PUBLIC_API_URL=http://localhost:4400/api npm run build
cd ../backend && npm run test:all  # auth.refresh.e2e-spec.ts
```

## 수정 원칙

1. 서버 컴포넌트는 `getServerApiBase()`; 클라이언트는 단일 `API_BASE` 헬퍼.
2. 인증 fetch는 `getAccessToken()` / `buildAuthHeader()` / `fetchWithAuth`로 수렴.
3. 로그아웃 시 쿠키·localStorage 모두 정리 (`clearAccessToken`).
4. 공개 페이지는 불필요한 `force-dynamic` 제거, 캐시는 `revalidate` 또는 `cache: 'no-store'` 명시.

## 연계 스킬

- UI/레이아웃 산출물: `canvas` (분석·표가 많을 때)
- PR 분할: `split-to-prs`
