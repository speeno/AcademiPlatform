# Design Audit: 공통 컴포넌트

**경로**: `frontend/components/`, `frontend/app/globals.css`

## P1

| 파일 | 이슈 | 상태 |
|------|------|------|
| brand-card.tsx | arbitrary hover, gray-900 | ✅ |
| brand-progress.tsx | gray-*, 인라인 color | ✅ |
| brand-badge.tsx | arbitrary var(), gray dot | ✅ |

## P2

| 항목 | 상태 |
|------|------|
| globals.css 타이포 유틸 (display/heading/body/caption) | ✅ |
| PageHeader / PageShell / Section | ✅ |
| AppSidebar (light/dark) | ✅ |

## 유지 허용

- `Logo.tsx` — width/height 동적 px (브랜드 에셋)
- `HeroBanner.tsx` — backgroundImage URL, overlayOpacity (콘텐츠 주입)
- Progress bar `style={{ width }}` — 동적 퍼센트
