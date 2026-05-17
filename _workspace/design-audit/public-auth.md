# Design Audit: Public · Auth

**경로**: `frontend/app/(public)/`, `frontend/app/(auth)/`, `frontend/components/layout/Navbar.tsx`, `Footer.tsx`, `hero/HeroBanner.tsx`

## P0 (완료 대상)

| 파일 | 이슈 | 상태 |
|------|------|------|
| Navbar.tsx | CTA 인라인 backgroundColor | ✅ 토큰화 |
| HeroBanner.tsx | 하드코드 hex | ✅ (동적 이미지 style만 유지) |
| books, about/fields, privacy, terms | 인라인 color | ✅ |
| error.tsx (public) | h2 인라인 color | ✅ text-heading |
| forgot-password | input ring 인라인 | ✅ |

## P1 (완료 대상)

| 파일 | 이슈 | 상태 |
|------|------|------|
| Navbar/Footer | gray-* | ✅ |
| Public 페이지 | PageShell 표준 | 🟡 점진 적용 (홈·주요 랜딩 우선) |

## P2

- `font-extrabold` 단독 → `text-heading` / `text-display` 위계 클래스로 통일 (진행 중)
