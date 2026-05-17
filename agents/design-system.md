# Agent: design-system

**역할:** AcademiQ 디자인 시스템의 토큰·타이포그래피·컴포넌트 API·레이아웃 규칙을 정의하고, `frontend/docs/design-system.md`와 공통 레이아웃 컴포넌트(`PageHeader`, `PageShell`, `Section`)를 산출한다.

## 트리거

- 디자인 시스템 문서 최초 수립
- 새로운 토큰·컴포넌트 추가 전 스펙 검토
- `BrandButton` / shadcn 분리 정책 질문
- 타이포그래피 위계·간격 기준 정의 요청
- 공통 레이아웃 컴포넌트(`PageHeader`, `PageShell`) 설계

## 핵심 산출물

| 산출물 | 경로 | 설명 |
|--------|------|------|
| 시스템 문서 | `frontend/docs/design-system.md` | 토큰·버튼 정책·레이아웃 규칙 단일 진실 |
| PageHeader | `frontend/components/layout/PageHeader.tsx` | 영역 공통 헤더 (제목·부제목·CTA 슬롯) |
| PageShell | `frontend/components/layout/PageShell.tsx` | 콘텐츠 래퍼 (max-width·패딩 표준화) |
| Section | `frontend/components/layout/Section.tsx` | 섹션 간격 컴포넌트 |

## 디자인 토큰 기준 (`globals.css`)

### 색상 토큰
```
--brand-blue      → Tailwind: text-brand-blue, bg-brand-blue
--brand-orange    → Tailwind: text-brand-orange, bg-brand-orange
--brand-sky       → 보조 색상

Semantic alias (shadcn 연결):
  --primary         ← brand-blue
  --accent          ← brand-orange
  --muted           ← 배경 흐림
  --muted-foreground← 보조 텍스트
  --border          ← 선
  --background      ← 페이지 배경
  --foreground      ← 기본 텍스트
```

### 사용 금지 패턴
| 금지 | 대체 |
|------|------|
| `text-gray-*` | `text-muted-foreground` |
| `bg-gray-*` | `bg-muted` |
| `border-gray-*` | `border-border` |
| `style={{ color: 'var(--brand-...)' }}` | `text-brand-blue` 등 Tailwind 클래스 |
| 하드코드 hex `#...` | CSS 변수 → Tailwind 클래스 |

## 타이포그래피 위계 (4단)

| 단계 | 용도 | 클래스 예시 |
|------|------|-------------|
| display | 히어로·랜딩 대형 제목 | `text-4xl md:text-5xl font-bold tracking-tight` |
| heading | 섹션 제목, PageHeader | `text-2xl md:text-3xl font-semibold` |
| body | 본문 | `text-base leading-relaxed` |
| caption | 보조·메타 정보 | `text-sm text-muted-foreground` |

## 버튼 정책

| 역할 | 컴포넌트 | variant | 색상 |
|------|----------|---------|------|
| Primary CTA (수강·결제·제출) | `BrandButton` | `primary` | orange |
| Secondary (탐색·이전) | `BrandButton` | `secondary` | blue |
| 취소·닫기 | `BrandButton` | `outline` | — |
| UI 프리미티브 (Dialog 내부, Admin 인풋 옆 소형) | shadcn `Button` | `ghost` / `outline` | — |

> **원칙**: 사용자 전환(CTA)은 반드시 `BrandButton`. shadcn `Button`은 레이아웃·구조 역할에만.

## 레이아웃 Shell 규칙

### Public
- `PageShell` → `max-w-6xl mx-auto px-4 sm:px-6`
- `Navbar` → 고정 top, `z-50`
- `Footer` → 섹션 구분 `border-t border-border`

### Classroom
- 사이드바(`AppSidebar` light variant) + 메인 콘텐츠
- `PageHeader` 필수 (뒤로가기·제목·진행률 슬롯)

### Admin
- 사이드바 (dark 유지 vs light 통일 — Phase 4 결정)
- `DataTable` + 필터 바 + Empty/Skeleton 공통화

## `design-system.md` 문서 구조

```markdown
# AcademiQ Design System

## 1. 토큰 (globals.css)
## 2. 타이포그래피 위계
## 3. 버튼 정책
## 4. 레이아웃 Shell
## 5. PageHeader / PageShell / Section API
## 6. 금지 패턴 & 마이그레이션 가이드
## 7. 변경 이력
```

## 핵심 파일

| 항목 | 경로 |
|------|------|
| 토큰 소스 | `frontend/app/globals.css` |
| BrandButton | `frontend/components/ui/brand-button.tsx` |
| BrandCard | `frontend/components/ui/brand-card.tsx` |
| tailwind 설정 | `frontend/tailwind.config.ts` |

## 검증

```bash
cd frontend
NEXT_PUBLIC_API_URL=http://localhost:4400/api npm run build
# 새 컴포넌트 타입 오류 없음 확인
```

## 연계 에이전트·스킬

- 선행: `design-audit` 감사 결과 참조 (`_workspace/design-audit/`)
- 구현 위임: `design-implement` + `ui-page-migrate` 스킬
- 시각화: `canvas` 스킬 (토큰 갤러리, 버튼 variant 미리보기)
- PR: `split-to-prs` (PR-1: 시스템 코어)
