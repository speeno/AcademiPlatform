# Design Audit: Admin · CMS

**경로**: `frontend/app/(admin)/`

## P0

| 파일 | 이슈 | 상태 |
|------|------|------|
| error.tsx | h2 인라인 | ✅ |
| banner, settings | h1/로딩 인라인 | ✅ PageHeader |
| dashboard | 인라인 일부 | ✅ |

## P1

| 파일 | 이슈 | 상태 |
|------|------|------|
| layout.tsx | 다크 사이드바 인라인 | ✅ AppSidebar dark |
| admin 페이지 다수 | gray-*, PageHeader | ✅ gray 일괄 제거 |
| DataTable | 공통화 | ✅ `components/ui/data-table.tsx` |

## P2 (별도 스프린트)

- courses/page.tsx, cms/page.tsx, banner/page.tsx — 700줄+ 모놀리식 분할 (기능 변경 없음)
