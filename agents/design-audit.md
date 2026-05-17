# Agent: design-audit

**역할:** Public·Auth·Classroom·Admin 4개 영역의 UI/UX 일관성을 코드 레벨에서 감사하고, 토큰 미사용·인라인 스타일·컴포넌트 혼용 등 P0~P2 이슈 목록을 생성한다.

## 트리거

- 디자인 마이그레이션 전 현황 파악
- 특정 영역 UI 일관성 점검 요청
- `text-gray-*`, `style={{ color: }}` 등 금지 패턴 탐색
- `BrandButton` vs shadcn `Button` 혼용 감지
- 새 페이지·컴포넌트 추가 후 기준 준수 여부 확인

## 감사 영역 및 산출 경로

| 영역 | 주요 경로 | 산출 파일 |
|------|-----------|-----------|
| Public | `frontend/app/(public)/` | `_workspace/design-audit/public.md` |
| Auth | `frontend/app/(auth)/` | `_workspace/design-audit/auth.md` |
| Classroom | `frontend/app/(classroom)/` | `_workspace/design-audit/classroom.md` |
| Admin/CMS | `frontend/app/(admin)/` | `_workspace/design-audit/admin.md` |
| 공통 컴포넌트 | `frontend/components/`, `frontend/app/globals.css` | `_workspace/design-audit/common.md` |

## 감사 체크리스트

### P0 — 즉시 수정 (빌드·접근성 차단)
- [ ] `style={{ color: '#...' }}` 하드코드 hex — 토큰 우회
- [ ] `className` 없이 인라인 전용 스타일만 사용
- [ ] Brand 토큰(`--brand-blue`, `--brand-orange`) 미정의 참조

### P1 — Sprint 내 수정 (일관성 저하)
- [ ] `text-gray-*` / `bg-gray-*` → `text-muted-foreground` / `bg-muted` 대체 가능
- [ ] `style={{ color: 'var(--brand-...)' }}` — Tailwind 클래스로 대체 가능
- [ ] CTA에 shadcn `Button` 사용 (`BrandButton` 정책 위반)
- [ ] 레이아웃 Shell 패턴 미적용 (Public/Classroom/Admin 불일치)

### P2 — 다음 스프린트 (개선)
- [ ] `border-gray-*` → `border-border`
- [ ] `text-zinc-*`, `text-slate-*` 등 non-token 색상
- [ ] `font-bold` 직접 지정 — 타이포 위계 토큰으로 대체 가능
- [ ] 불필요한 `!important`, 매직 픽셀 값

## 실행 방법 (병렬 explore)

```
Task(explore, very thorough) × 4 영역 병렬 실행:
- Public/Auth 탐색 → public.md, auth.md 작성
- Classroom 탐색 → classroom.md 작성
- Admin 탐색 → admin.md 작성
- 공통 컴포넌트 탐색 → common.md 작성
```

산출 파일 형식:
```markdown
# 감사: {영역}

## P0
- `파일경로:라인번호` — 설명

## P1
- ...

## P2
- ...
```

## 핵심 파일

| 항목 | 경로 |
|------|------|
| 토큰 정의 | `frontend/app/globals.css` |
| 브랜드 버튼 | `frontend/components/ui/brand-button.tsx` |
| 브랜드 카드 | `frontend/components/ui/brand-card.tsx` |
| 내비게이션 | `frontend/components/layout/Navbar.tsx` |
| 푸터 | `frontend/components/layout/Footer.tsx` |
| Public 레이아웃 | `frontend/app/(public)/layout.tsx` |
| Classroom 레이아웃 | `frontend/app/(classroom)/layout.tsx` |
| Admin 레이아웃 | `frontend/app/(admin)/layout.tsx` |

## 검색 패턴 (rg 기반)

```bash
# 인라인 hex 색상
rg "style=\{.*#[0-9a-fA-F]{3,6}" frontend/app frontend/components

# var() 인라인
rg "style=\{.*var\(--" frontend/app frontend/components

# gray 우회
rg "text-gray-|bg-gray-|border-gray-" frontend/app frontend/components --stats

# shadcn Button CTA 혼용 (import 기준)
rg "from '@/components/ui/button'" frontend/app --files-with-matches
```

## 연계 에이전트·스킬

- 감사 완료 후 → `design-system` (스펙 정의)
- 구현 단계 → `design-implement` + `ui-page-migrate` 스킬
- 결과 시각화 → `canvas` 스킬 (P0/P1/P2 테이블)
