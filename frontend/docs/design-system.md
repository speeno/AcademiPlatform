# AcademiQ Design System

본 문서는 AcademiQ 프론트엔드의 토큰·타이포·컴포넌트·레이아웃 규칙의 단일 진실 (Single Source of Truth) 입니다. 새 UI를 작성하거나 기존 페이지를 마이그레이션하기 전 본 문서를 먼저 참조하세요.

관련 스킬: [`.cursor/skills/design-system/SKILL.md`](.cursor/skills/design-system/SKILL.md), [`.cursor/skills/ui-page-migrate/SKILL.md`](.cursor/skills/ui-page-migrate/SKILL.md).

---

## 1. 토큰 (`frontend/app/globals.css`)

모든 색상·여백·반경 토큰은 [`frontend/app/globals.css`](../app/globals.css) `:root` 블록에만 정의합니다. 페이지·컴포넌트에서는 **Tailwind 클래스로만** 사용합니다.

### 1.1 색상 토큰 → 클래스 매핑

| CSS 변수 | Tailwind 클래스 | 용도 |
|----------|-----------------|------|
| `--brand-blue` | `text-brand-blue`, `bg-brand-blue`, `border-brand-blue` | 브랜드 주색, 제목, secondary CTA |
| `--brand-blue-dark` | `text-brand-blue-dark`, `bg-brand-blue-dark` | hover, dark variant |
| `--brand-blue-subtle` | `bg-brand-blue-subtle` | 카드/배너 배경 |
| `--brand-orange` | `text-brand-orange`, `bg-brand-orange` | Primary CTA, 강조 |
| `--brand-orange-subtle` | `bg-brand-orange-subtle` | 배지 배경 |
| `--brand-sky` | `text-brand-sky`, `bg-brand-sky` | 보조 강조 |
| `--brand-green`, `--brand-lime` | `text-brand-green`, `bg-brand-lime` | 그라디언트 중간색 |
| `--primary` (= brand-blue) | `text-primary`, `bg-primary` | shadcn primary |
| `--accent` (= brand-orange) | `text-accent`, `bg-accent` | shadcn accent |
| `--muted` | `bg-muted` | 흐린 배경 |
| `--muted-foreground` | `text-muted-foreground` | 보조 텍스트 |
| `--border` | `border-border` | 구분선 |
| `--background` | `bg-background` | 페이지 배경 |
| `--foreground` | `text-foreground` | 기본 텍스트 |

### 1.2 금지 패턴

```text
text-gray-{n}           → text-muted-foreground 또는 text-foreground
bg-gray-{n}             → bg-muted
border-gray-{n}         → border-border
text-zinc-*, slate-*    → 동일 (사용 금지)
style={{ color: '#xxx' }}                → 브랜드 클래스
style={{ color: 'var(--brand-...)' }}    → text-brand-blue 등
style={{ backgroundColor: 'var(--brand-...)' }} → bg-brand-orange 등
```

### 1.3 새 색상 추가 절차

1. [`frontend/app/globals.css`](../app/globals.css) `:root` 에 CSS 변수 정의.
2. 동일 파일의 `@theme inline` 블록에 `--color-<name>: var(--<name>);` 추가.
3. 페이지에서는 `text-<name>` / `bg-<name>` 사용 (직접 `var(...)` 참조 금지).

---

## 2. 타이포그래피 위계 (4단)

[`globals.css`](../app/globals.css) `@layer utilities` 에 정의된 공통 클래스:

| 단계 | 클래스 | 용도 |
|------|--------|------|
| display | `text-display` | 히어로·랜딩 대형 제목 (`text-4xl md:text-5xl`, bold) |
| heading | `text-heading` | PageHeader, 페이지 제목 (`text-2xl md:text-3xl`, bold) |
| subheading | `text-subheading` | Section 제목, 카드 제목 (`text-xl`, semibold) |
| body | `text-body` | 본문 (`text-base leading-relaxed`) |
| caption | `text-caption` | 보조·메타 (`text-sm text-muted-foreground`) |

원칙: 페이지에서 직접 `text-2xl font-extrabold` 등 조합하지 말고, 가능한 위계 클래스 사용.

---

## 3. 버튼 정책

| 역할 | 컴포넌트 | variant |
|------|----------|---------|
| Primary CTA (수강 신청, 결제, 제출) | [`BrandButton`](../components/ui/brand-button.tsx) | `primary` (orange) |
| Secondary (탐색, 상세보기, 뒤로) | `BrandButton` | `secondary` (blue) |
| 취소, 닫기 | `BrandButton` | `outline` |
| Dialog/Sheet 내부 보조 액션, 테이블 아이콘 버튼 | shadcn [`Button`](../components/ui/button.tsx) | `ghost` / `outline` |

**원칙:** 사용자 전환(conversion)에 영향을 미치는 CTA는 반드시 `BrandButton`. shadcn `Button` 은 레이아웃·구조 역할에만 사용.

**금지 예:**
```tsx
// 잘못된 예
<Button style={{ backgroundColor: 'var(--brand-orange)', color: 'white' }}>
  수강 신청
</Button>

// 올바른 예
<BrandButton variant="primary">수강 신청</BrandButton>
```

---

## 4. 레이아웃 컴포넌트 API

### 4.1 [`PageShell`](../components/layout/PageShell.tsx)

페이지 콘텐츠 래퍼. 좌우 패딩·max-width 표준화.

```tsx
import { PageShell } from '@/components/layout/PageShell';

<PageShell>                      {/* size="default" → max-w-6xl */}
  <PageHeader title="..." />
  ...
</PageShell>

<PageShell size="narrow">...</PageShell>  {/* 폼·설정 — max-w-2xl */}
<PageShell size="wide">...</PageShell>    {/* Admin 테이블 — max-w-7xl */}
<PageShell size="full">...</PageShell>    {/* 풀폭 */}
<PageShell flush>...</PageShell>          {/* py 제거 */}
```

### 4.2 [`PageHeader`](../components/layout/PageHeader.tsx)

페이지 상단 공통 헤더 — 제목·설명·CTA 슬롯.

```tsx
import { PageHeader } from '@/components/layout/PageHeader';

<PageHeader
  title="강의 목록"
  description="AcademiQ의 현재 진행 중인 교육과정입니다."
/>

<PageHeader title="회원 관리" eyebrow="관리자">
  <BrandButton variant="primary">신규 회원</BrandButton>
</PageHeader>
```

### 4.3 [`Section`](../components/layout/Section.tsx)

섹션 단위 수직 간격 표준화.

```tsx
import { Section } from '@/components/layout/Section';

<Section>                       {/* py-12 (md) */}
  ...
</Section>

<Section spacing="lg" title="자격 특징" description="...">
  <Grid>...</Grid>
</Section>
```

### 4.4 [`AppSidebar`](../components/layout/AppSidebar.tsx)

Classroom·Admin 공통 좌측 사이드바. `variant`로 톤을 전환.

```tsx
import { AppSidebar } from '@/components/layout/AppSidebar';

// Classroom (light)
<AppSidebar
  variant="light"
  eyebrow="마이페이지"
  groups={[{ items: [{ href: '/mypage', icon: User, label: '마이페이지' }, ...] }]}
  footer={<Link href="/" className="text-xs text-muted-foreground">← 홈으로</Link>}
/>

// Admin (dark)
<AppSidebar
  variant="dark"
  eyebrow="관리자"
  homeHref="/admin/dashboard"
  width="md"
  groups={[
    { label: '대시보드', items: [...] },
    { label: '교육', items: [...] },
  ]}
  footer={<Link href="/" className="text-xs text-white/60">← 사이트로</Link>}
/>
```

- active 상태는 `usePathname()` 기준 자동 처리.
- `matchPrefix: true`로 prefix 매칭 (`/admin/courses/123` 등 하위 경로 포함).

### 4.5 [`DataTable`](../components/ui/data-table.tsx)

Admin·CMS 공통 테이블. 컬럼 정의로 렌더, 빈 상태·로딩 스켈레톤·행 클릭 표준화.

```tsx
import { DataTable } from '@/components/ui/data-table';

<DataTable
  columns={[
    { key: 'name', header: '이름', cell: (u) => u.name },
    { key: 'email', header: '이메일', cell: (u) => u.email, hideOnMobile: true },
    {
      key: 'actions',
      header: '',
      cell: (u) => <BrandButton size="sm" onClick={() => edit(u)}>편집</BrandButton>,
      className: 'w-28 text-right',
    },
  ]}
  rows={users}
  rowKey={(u) => u.id}
  loading={isLoading}
  empty={<p>회원이 없습니다.</p>}
  onRowClick={(u) => router.push(`/admin/users/${u.id}`)}
/>
```

---

## 5. 레이아웃 Shell 규칙

### 5.1 Public ([`(public)/layout.tsx`](../app/(public)/layout.tsx))

- `Navbar` → `sticky top-0 z-50 bg-white/95 backdrop-blur` + `border-b border-border`
- 본문 → `PageShell` (default 또는 wide)
- `Footer` → `border-t border-border`

### 5.2 Classroom ([`(classroom)/layout.tsx`](../app/(classroom)/layout.tsx))

- 좌측 사이드바 (`AppSidebar` light variant, Phase 3 도입)
- 본문 → `PageShell` default + `PageHeader` 필수

### 5.3 Admin ([`(admin)/layout.tsx`](../app/(admin)/layout.tsx))

- 좌측 사이드바 (`AppSidebar` dark variant, Phase 4 도입)
- 본문 → `PageShell wide` + `PageHeader` 필수
- 리스트 페이지는 공통 `DataTable` 사용 (Phase 4)

---

## 6. 마이그레이션 가이드 (체크리스트)

페이지를 수정하거나 신규 작성할 때 다음을 확인:

- [ ] 인라인 `style={{ color: 'var(--brand-...)' }}` 없음 → Tailwind 클래스
- [ ] `text-gray-*`, `bg-gray-*`, `border-gray-*` 없음 → `text-muted-foreground`, `bg-muted`, `border-border`
- [ ] 하드코드 hex `#xxxxxx` 없음 (그라디언트 정의 자체는 `globals.css`에서 변수로)
- [ ] 페이지는 `PageShell` 로 래핑됨
- [ ] 페이지 최상단 제목은 `PageHeader` 사용
- [ ] CTA는 `BrandButton`, 구조 버튼만 shadcn `Button`
- [ ] 타이포는 위계 클래스 (`text-heading`, `text-caption` 등) 사용
- [ ] 새 색상은 `globals.css`에 정의, 페이지에서는 클래스만 참조

---

## 7. Phase 1~5 로드맵 진행 상황

| Phase | 산출물 | 상태 |
|-------|--------|------|
| 0 | [`design-audit-summary.md`](./design-audit-summary.md) | 완료 |
| 1 | `PageShell`, `PageHeader`, `Section`, 타이포 유틸, 본 문서 | 완료 |
| 2 | Navbar/Footer/HeroBanner 토큰화, books/privacy/terms/forgot-password/fields 인라인 제거 | 완료 |
| 3 | `AppSidebar` (light/dark) 추출, Classroom/Admin layout 적용 | 완료 |
| 4 | `DataTable` 신설, Admin dashboard/settings/banner PageHeader 적용 | 완료 |
| 5 | Loader2(18종)·페이지 h1(24종) 일괄 토큰화, error.tsx 4종, build 검증 | 완료 |

### 잔여 점진 마이그레이션 대상

본 Phase 범위 외에 남아 있는 (영향도 P1~P2) 패턴은 다음과 같습니다. 신규/수정 시 즉시 적용을 원칙으로 합니다.

- 잔여 페이지의 `style={{ color: 'var(--brand-...)' }}` (배지·아이콘·소형 라벨 등) — 약 80여 곳
- 잔여 `text-gray-*`·`bg-gray-*`·`border-gray-*` — 약 80여 파일 (`text-muted-foreground`, `bg-muted`, `border-border`로 대체)
- 700줄+ 모놀리식 페이지(`admin/courses/page.tsx`, `admin/cms/page.tsx` 등) — hooks·하위 컴포넌트 분리는 별도 PR로

---

## 8. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-05-17 | Phase 0~5 — Harness 디자인 3에이전트·2스킬, design-system 코어, AppSidebar/DataTable, Loader/h1/error 패턴 일괄 토큰화, 빌드 통과 |
