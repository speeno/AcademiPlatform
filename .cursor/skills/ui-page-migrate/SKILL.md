# Skill: ui-page-migrate

**용도:** AcademiQ 페이지·컴포넌트를 디자인 시스템으로 마이그레이션할 때 사용하는 단계별 체크리스트. `design-implement` 에이전트와 함께 사용한다.

---

## 시작 전 필수 확인

1. `frontend/docs/design-system.md` 존재 확인
2. `_workspace/design-audit/{area}.md` 에서 해당 파일의 P0/P1 목록 확인
3. `.cursor/skills/design-system/SKILL.md` 규칙 숙지
4. 대상 파일의 **현재 상태** 읽기 (Read 툴)
5. **유사 컴포넌트 이미 존재하는지 확인** (신규 생성 전)

---

## 페이지 마이그레이션 체크리스트

### Step 1 — 감사 항목 수집

대상 파일에서 아래 패턴 탐색:

```bash
# 해당 파일에서 금지 패턴 확인
rg "text-gray-|bg-gray-|border-gray-|style=\{" {파일경로}
rg "from '@/components/ui/button'" {파일경로}
```

### Step 2 — 레이아웃 래핑 적용

```tsx
// Before
export default function CoursesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">강의 목록</h1>
      ...
    </div>
  )
}

// After
import { PageShell } from '@/components/layout/PageShell'
import { PageHeader } from '@/components/layout/PageHeader'

export default function CoursesPage() {
  return (
    <PageShell>
      <PageHeader title="강의 목록" />
      ...
    </PageShell>
  )
}
```

### Step 3 — 색상 토큰 치환

순서대로 처리 (StrReplace 툴 사용, replace_all 활용):

1. `text-gray-{n}` → `text-muted-foreground`
2. `bg-gray-{n}` → `bg-muted`
3. `border-gray-{n}` → `border-border`
4. `style={{ color: 'var(--brand-blue)' }}` → `className="text-brand-blue"` (해당 요소의 기존 className에 추가)
5. 하드코드 hex → CSS 변수 → 적합한 Tailwind 클래스

> **주의**: `gray-50`, `gray-100`은 문맥에 따라 `bg-background` 또는 `bg-muted`로 구분.

### Step 4 — 버튼 정책 적용

```tsx
// Before (CTA에 shadcn Button)
import { Button } from '@/components/ui/button'
<Button onClick={handleEnroll}>수강 신청</Button>

// After (CTA에 BrandButton)
import { BrandButton } from '@/components/ui/brand-button'
<BrandButton variant="primary" onClick={handleEnroll}>수강 신청</BrandButton>
```

shadcn `Button` 유지가 맞는 경우 (변경 금지):
- Dialog 내 Cancel 버튼
- Admin 테이블 소형 아이콘 버튼 (`ghost` variant)
- 폼 옆 부가 액션 (`outline` variant)

### Step 5 — 인라인 스타일 제거

```tsx
// Before
<h1 style={{ color: 'var(--brand-blue)', fontWeight: 'bold' }}>제목</h1>

// After
<h1 className="text-brand-blue font-semibold">제목</h1>
```

스타일 속성이 여러 개인 경우:
- `color` → 해당 색상 Tailwind 클래스
- `fontWeight` → `font-{weight}`
- `fontSize` → `text-{size}`
- `padding/margin` → `p-{n}` / `m-{n}`

### Step 6 — 빌드 검증

```bash
cd frontend
NEXT_PUBLIC_API_URL=http://localhost:4400/api npm run build
```

빌드 실패 시 확인 사항:
- 새 import 경로 오류 (`PageHeader`, `PageShell` 미생성)
- `BrandButton` props 타입 불일치
- 조건부 className에서 문자열 합산 오류 (`cn()` 유틸 사용)

---

## 파일 유형별 마이그레이션 가이드

### Public 페이지 (`app/(public)/`)

```
목표:
- PageShell 래핑 (max-w-6xl)
- HeroBanner: 하드코드 hex → 토큰
- 강의 목록: BrandCard 사용
- CTA 버튼: BrandButton primary
- Section 컴포넌트로 간격 통일
```

### Auth 페이지 (`app/(auth)/`)

```
목표:
- 현행 login/page.tsx 패턴을 표준으로 유지
- 폼 컨테이너: shadcn Card (브랜드 불필요)
- 제출: BrandButton primary
- 링크: text-brand-blue (shadcn Link 스타일 override)
```

### Classroom 페이지 (`app/(classroom)/`)

```
목표:
- AppSidebar: light variant (nav active 토큰)
- 각 페이지: PageHeader (뒤로가기·제목·진행률)
- CoursePackageViewer: 탭·진행률 집중 UX
- PageShell size="full" (사이드바 공간 활용)
```

### Admin 페이지 (`app/(admin)/`)

```
목표 (Phase 4):
- 사이드바 톤: Phase 4 결정 후 반영
- 대형 파일 분할: hooks + 하위 컴포넌트 (기능 변경 금지)
- DataTable 공통화
- 필터 바, Empty, Skeleton 토큰 적용
```

---

## 공통 패턴 — `cn()` 유틸

```tsx
import { cn } from '@/lib/utils'

// 조건부 클래스 (인라인 삼항 대신)
<div className={cn(
  'base-class',
  isActive && 'text-brand-blue',
  isDisabled && 'opacity-50 cursor-not-allowed'
)}>
```

---

## 완료 기준 (Definition of Done)

- [ ] `rg "text-gray-|bg-gray-|border-gray-" {파일}` → 0건
- [ ] `rg "style=\{.*color" {파일}` → 0건 (또는 불가피한 케이스 주석)
- [ ] CTA 버튼 → `BrandButton`
- [ ] 레이아웃 → `PageShell` + `PageHeader` 적용
- [ ] `npm run build` 성공
- [ ] 기능 동작 변화 없음 (수동 확인)

---

## 회귀 방지 원칙

1. **기능 로직 분리**: UI 클래스만 변경, `onClick`·`fetch`·조건 로직 불변
2. **한 파일씩**: 대형 파일은 섹션 단위로 분리 후 빌드 확인
3. **중복 컴포넌트 금지**: 유사한 컴포넌트가 이미 있으면 신규 생성 금지
4. **타입 안전**: 컴포넌트 교체 시 props 타입 맞춤 확인

---

## 참조

| 파일 | 역할 |
|------|------|
| `.cursor/skills/design-system/SKILL.md` | 토큰·버튼 정책 규칙 |
| `frontend/docs/design-system.md` | 시스템 전체 문서 |
| `_workspace/design-audit/` | 영역별 P0/P1/P2 목록 |
| `agents/design-implement.md` | 스프린트 실행 에이전트 |
