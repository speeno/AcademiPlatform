# Skill: design-system

**용도:** AcademiQ 디자인 시스템의 토큰 네이밍 규칙, Brand vs shadcn 컴포넌트 분리 정책, 금지 패턴 참조. 코드 작성·리뷰 전 이 스킬을 읽어 규칙을 확인한다.

---

## 1. 색상 토큰 네이밍

### CSS 변수 → Tailwind 클래스 매핑

| CSS 변수 | Tailwind 클래스 | 용도 |
|----------|-----------------|------|
| `--brand-blue` | `text-brand-blue` / `bg-brand-blue` | 브랜드 주색, secondary CTA |
| `--brand-orange` | `text-brand-orange` / `bg-brand-orange` | CTA 강조색 |
| `--brand-sky` | `text-brand-sky` / `bg-brand-sky` | 보조 강조 |
| `--primary` | `text-primary` / `bg-primary` | shadcn primary (= brand-blue) |
| `--accent` | `text-accent` / `bg-accent` | shadcn accent (= brand-orange) |
| `--muted` | `bg-muted` | 흐린 배경 |
| `--muted-foreground` | `text-muted-foreground` | 보조 텍스트 |
| `--border` | `border-border` | 구분선 |
| `--background` | `bg-background` | 페이지 배경 |
| `--foreground` | `text-foreground` | 기본 텍스트 |

### 금지 패턴 (절대 사용 금지)

```
❌ text-gray-{n}           → ✅ text-muted-foreground
❌ bg-gray-{n}             → ✅ bg-muted
❌ border-gray-{n}         → ✅ border-border
❌ text-zinc-*, text-slate-* → ✅ text-foreground 또는 text-muted-foreground
❌ style={{ color: '#xxxxxx' }}        → ✅ Tailwind 클래스
❌ style={{ color: 'var(--brand-...)' }} → ✅ text-brand-blue 등
❌ style={{ backgroundColor: ... }}   → ✅ bg-* 클래스
```

### 새 색상 추가 규칙

1. `frontend/app/globals.css` `:root` 블록에만 CSS 변수 추가
2. `frontend/tailwind.config.ts`의 `extend.colors`에 토큰 매핑 추가
3. 페이지·컴포넌트에서는 클래스만 사용 (`text-brand-*`, `bg-brand-*`)

---

## 2. 컴포넌트 분리 정책 (Brand vs shadcn)

### BrandButton — 언제 쓰나

```tsx
import { BrandButton } from '@/components/ui/brand-button'

// ✅ Primary CTA: 수강 신청, 결제, 제출
<BrandButton variant="primary">수강 신청</BrandButton>

// ✅ Secondary: 탐색, 뒤로가기, 상세보기
<BrandButton variant="secondary">강의 보기</BrandButton>

// ✅ Outline: 취소, 닫기
<BrandButton variant="outline">취소</BrandButton>
```

### shadcn Button — 언제 쓰나

```tsx
import { Button } from '@/components/ui/button'

// ✅ Dialog·Sheet 내부 보조 액션
// ✅ Admin 테이블 소형 아이콘 버튼 (ghost)
// ✅ 폼 내부 인풋 옆 부가 버튼 (outline)
// ❌ 사용자 전환(CTA) 역할에는 절대 사용 금지
```

### BrandCard vs shadcn Card

| 컴포넌트 | 용도 |
|----------|------|
| `BrandCard` | 강의 카드, 상품 카드, 강조 콘텐츠 카드 |
| shadcn `Card` | Admin 통계 위젯, 폼 컨테이너, 단순 래퍼 |

### shadcn 프리미티브 (항상 shadcn 사용)

- `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`
- `Dialog`, `Sheet`, `Popover`, `Tooltip`
- `Table`, `Tabs` (스타일 override 가능)
- `Badge` — 단, 브랜드 강조는 `BrandBadge`

---

## 3. 타이포그래피 위계

| 단계 | 클래스 조합 | 사용 위치 |
|------|-------------|-----------|
| display | `text-4xl md:text-5xl font-bold tracking-tight` | 히어로, 랜딩 |
| heading | `text-2xl md:text-3xl font-semibold` | 섹션 제목, PageHeader |
| subheading | `text-xl font-semibold` | 카드 제목, 모달 제목 |
| body | `text-base leading-relaxed` | 본문 |
| caption | `text-sm text-muted-foreground` | 보조 설명, 메타 |

---

## 4. 레이아웃 컴포넌트 API

### PageHeader

```tsx
import { PageHeader } from '@/components/layout/PageHeader'

<PageHeader
  title="강의 목록"           // 필수 (heading 단계)
  description="..." />       // 선택 (caption 단계)

// 우측 CTA 슬롯
<PageHeader title="...">
  <BrandButton variant="primary">새 강의</BrandButton>
</PageHeader>
```

### PageShell

```tsx
import { PageShell } from '@/components/layout/PageShell'

// Public: max-w-6xl
<PageShell>...</PageShell>

// Narrow (폼·설정): max-w-2xl
<PageShell size="narrow">...</PageShell>

// Full (Admin 테이블): max-w-full
<PageShell size="full">...</PageShell>
```

### Section

```tsx
import { Section } from '@/components/layout/Section'

<Section>...</Section>               // py-12 기본
<Section spacing="lg">...</Section>  // py-20 (히어로 아래)
<Section spacing="sm">...</Section>  // py-6 (카드 그룹)
```

---

## 5. 적용 체크리스트

파일을 수정·생성하기 전 확인:

- [ ] 색상: CSS 변수 직접 참조(`var(--...)`) 대신 Tailwind 클래스 사용
- [ ] 색상: `gray-*` 없음 → `muted-*` 또는 `border`
- [ ] 버튼: CTA는 `BrandButton`, 구조적 역할만 shadcn `Button`
- [ ] 레이아웃: `PageShell` 래핑, `PageHeader` 사용
- [ ] 타이포: `font-bold` 단독 지정보다 위계 클래스 조합 사용
- [ ] 신규 색상: `globals.css`에만 추가 후 클래스 사용

---

## 6. 참조 파일

| 파일 | 역할 |
|------|------|
| `frontend/app/globals.css` | 토큰 소스 (단일 진실) |
| `frontend/tailwind.config.ts` | 토큰 → Tailwind 매핑 |
| `frontend/components/ui/brand-button.tsx` | BrandButton 구현 |
| `frontend/components/ui/brand-card.tsx` | BrandCard 구현 |
| `frontend/docs/design-system.md` | 전체 시스템 문서 |
