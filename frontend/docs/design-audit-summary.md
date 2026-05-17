# Design Audit Summary

Phase 0 산출물. 4영역(Public/Auth, Classroom, Admin, Common) 디자인 일관성 감사 결과 통합본입니다. 후속 마이그레이션(Phase 1~5)의 작업 우선순위와 영향 파일 매핑을 제공합니다.

---

## 1. 통합 우선순위 (P0~P2)

| 우선 | 분류 | 개수 (대략) | 영향 |
|------|------|-------------|------|
| P0 | 토큰 우회 인라인 스타일 (`style={{ color: 'var(...)' }}`, hex) | 30+ 파일 | 일괄 변경·다크모드 차단 |
| P0 | shadcn `Button`에 `style={{ backgroundColor }}` 직접 지정 | 2+ ([`Navbar.tsx`](frontend/components/layout/Navbar.tsx)) | CTA 정책 위반 |
| P1 | `text-gray-*` / `bg-gray-*` / `border-gray-*` | 80+ 파일 | 톤 불일치 |
| P1 | 레이아웃 Shell 미사용 (페이지마다 max-w/padding 임의) | 다수 admin·classroom | 레이아웃 일관성 |
| P1 | 사이드바 코드 중복 (Classroom vs Admin) | 2개 layout | 유지보수 |
| P2 | `font-extrabold` 단독 지정 vs 타이포 위계 토큰 | 다수 | 정보 위계 모호 |
| P2 | `border-gray-*`, `text-zinc-*` 등 비표준 토큰 | 일부 | 다크모드 확장성 |

---

## 2. 영역별 핵심 이슈

### 2.1 Public · Auth

**대상 경로**: [`frontend/app/(public)/`](frontend/app/(public)), [`frontend/app/(auth)/`](frontend/app/(auth))

| 우선 | 파일 | 이슈 |
|------|------|------|
| P0 | [`components/layout/Navbar.tsx`](frontend/components/layout/Navbar.tsx) L152, L174, L220 | `style={{ backgroundColor: 'var(--brand-orange)' }}`, 인라인 그라디언트 |
| P0 | [`components/hero/HeroBanner.tsx`](frontend/components/hero/HeroBanner.tsx) L132, L188-189, L245 | 하드코드 hex (`#F5A023`, `#0A1A4A` 등) |
| P0 | [`app/(public)/books/page.tsx`](frontend/app/(public)/books/page.tsx) L50, L53, L79, L88 | `style={{ color: 'var(--brand-...)' }}` 4곳 |
| P0 | [`app/(public)/about/fields/page.tsx`](frontend/app/(public)/about/fields/page.tsx) L22, L23, L33, L41 | `style={{ background: 'var(--gradient-logo)' }}` |
| P0 | [`app/(public)/privacy/page.tsx`](frontend/app/(public)/privacy/page.tsx), [`terms/page.tsx`](frontend/app/(public)/terms/page.tsx) | h1 인라인 color |
| P0 | [`app/(public)/error.tsx`](frontend/app/(public)/error.tsx) L18 | h2 인라인 color |
| P0 | [`app/(auth)/forgot-password/page.tsx`](frontend/app/(auth)/forgot-password/page.tsx) L60, L72 | input ring·link 인라인 |
| P1 | Navbar nav links · 모바일 메뉴 | `text-gray-600`, `text-gray-700` |
| P1 | [`components/layout/Footer.tsx`](frontend/components/layout/Footer.tsx) | gray-* 다수, 인라인 italic color |
| P1 | Public 페이지 다수 | `max-w-*`, `px-4` 등 임의 — `PageShell` 표준 부재 |

### 2.2 Classroom · Learner

**대상 경로**: [`frontend/app/(classroom)/`](frontend/app/(classroom))

| 우선 | 파일 | 이슈 |
|------|------|------|
| P0 | [`app/(classroom)/error.tsx`](frontend/app/(classroom)/error.tsx) L18 | h2 인라인 color |
| P0 | [`app/(classroom)/mypage/payments/page.tsx`](frontend/app/(classroom)/mypage/payments/page.tsx) L54, L62, L89 | 로딩·헤딩·금액 인라인 color |
| P0 | [`app/(classroom)/classroom/instructor/board/[id]/page.tsx`](frontend/app/(classroom)/classroom/instructor/board/[id]/page.tsx) L105 | Loader2 인라인 color |
| P1 | [`app/(classroom)/layout.tsx`](frontend/app/(classroom)/layout.tsx) | 사이드바 인라인 구현 (재사용 컴포넌트 없음) |
| P1 | mypage·textbooks·classroom 페이지 다수 | `PageHeader` 부재, `text-gray-*` 다수 |
| P1 | [`components/course-package/CoursePackageViewer.tsx`](frontend/components/course-package/CoursePackageViewer.tsx) | 학습 집중 UI 톤 불일치 |

### 2.3 Admin · CMS

**대상 경로**: [`frontend/app/(admin)/`](frontend/app/(admin))

| 우선 | 파일 | 이슈 |
|------|------|------|
| P0 | [`app/(admin)/error.tsx`](frontend/app/(admin)/error.tsx) L18 | h2 인라인 color |
| P0 | [`app/(admin)/admin/banner/page.tsx`](frontend/app/(admin)/admin/banner/page.tsx) L134, L394 | h1 + 오버레이 그라디언트 인라인 |
| P0 | [`app/(admin)/admin/settings/page.tsx`](frontend/app/(admin)/admin/settings/page.tsx) L53, L61 | 로딩·헤딩 인라인 color |
| P1 | [`app/(admin)/layout.tsx`](frontend/app/(admin)/layout.tsx) | 다크 사이드바 인라인 (`bg-gray-900`, `text-white/10`) — 재사용 부재 |
| P1 | admin 페이지 다수 (users, payments, courses, cms, notices, faq, ...) | 테이블·필터·empty 패턴 반복, `PageHeader` 부재 |
| P1 | `text-gray-*` import 평균 8~26회 / 페이지 | 톤 불일치 |
| P2 | [`admin/courses/page.tsx`](frontend/app/(admin)/admin/courses/page.tsx), [`admin/cms/page.tsx`](frontend/app/(admin)/admin/cms/page.tsx), [`admin/banner/page.tsx`](frontend/app/(admin)/admin/banner/page.tsx) | 700줄+ 모놀리식 페이지 |

### 2.4 공통 컴포넌트

**대상 경로**: [`frontend/components/`](frontend/components), [`frontend/app/globals.css`](frontend/app/globals.css)

| 우선 | 파일 | 이슈 |
|------|------|------|
| P1 | [`components/ui/brand-card.tsx`](frontend/components/ui/brand-card.tsx) L41 | `hover:border-[var(--brand-sky)]` arbitrary value |
| P1 | [`components/ui/brand-card.tsx`](frontend/components/ui/brand-card.tsx) L63 | `text-gray-900` |
| P1 | [`components/ui/brand-progress.tsx`](frontend/components/ui/brand-progress.tsx) L43 | span 인라인 color |
| P2 | `globals.css` 타이포 유틸 부재 | ✅ `text-display`/`text-heading`/`text-body`/`text-caption` 정의됨 |
| P2 | `PageHeader`/`PageShell`/`Section` 미존재 | ✅ `frontend/components/layout/` 생성 완료 |

---

## 3. 마이그레이션 도구 — 검색 패턴

```bash
# 인라인 var(--brand-...) 색상
rg "style=\{.*var\(--brand-" frontend/app frontend/components

# 인라인 hex
rg "style=\{[^}]*#[0-9a-fA-F]{3,6}" frontend/app frontend/components

# gray 우회
rg "text-gray-|bg-gray-|border-gray-" frontend --stats

# shadcn Button import (CTA 위치 검사)
rg "from '@/components/ui/button'" frontend/app --files-with-matches
```

---

## 4. Phase 1~5 매핑

| Phase | 우선 처리 |
|-------|-----------|
| 1 — 코어 | `PageHeader`/`PageShell`/`Section` 생성, `globals.css` 타이포 유틸 추가, 4개 `error.tsx` 파일럿 |
| 2 — Public·Auth | `Navbar.tsx`, `Footer.tsx`, `HeroBanner.tsx` 부분 토큰화, books/about/privacy/terms 인라인 제거 |
| 3 — Classroom | `AppSidebar` 추출 (light variant), classroom layout 갱신, mypage/payments 토큰화 |
| 4 — Admin | `AppSidebar` dark variant 적용, `DataTable` 신설, admin layout/error 토큰화 |
| 5 — Polish | `HeroBanner` 잔여 hex, Loader 통일, global-error.tsx 점검, build 검증 |

---

## 5. 비고

- 모든 `PageHeader` 적용은 신규 컴포넌트(Phase 1)이며, 기존 페이지는 점진 채택.
- 700줄+ 모놀리식 페이지 분할은 **Phase 4에서 기능 변경 없이** 진행, 본 Plan 범위 내에서 최소 2개(courses, banner)만 시범 분할 후 패턴 문서화.
- 다크 모드 토글은 본 Plan 범위 외(별도 이슈).
