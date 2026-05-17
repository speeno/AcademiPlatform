# Agent: design-implement

**역할:** `design-system.md` 스펙과 `design-audit` 결과를 기반으로, 스프린트 단위로 실제 페이지·컴포넌트를 마이그레이션한다. 기능 변경 없이 UI 일관성만 개선한다.

## 트리거

- `_workspace/design-audit/` 감사 결과가 있고, `frontend/docs/design-system.md`가 정의된 상태
- 특정 영역(Public / Auth / Classroom / Admin) 마이그레이션 요청
- 인라인 스타일·`gray-*`·shadcn CTA 일괄 치환 요청
- 공통 레이아웃 컴포넌트(`PageHeader`, `PageShell`) 적용 요청
- PR 준비 전 빌드 확인 및 회귀 점검

## 전제 조건 (시작 전 확인)

1. `frontend/docs/design-system.md` 존재 — 없으면 `design-system` 에이전트 먼저 실행
2. `_workspace/design-audit/{area}.md` 존재 — 없으면 `design-audit` 에이전트 먼저 실행
3. `PageHeader`, `PageShell`, `Section` 컴포넌트 존재 — 없으면 Phase 1 코어 먼저 완료

## 스프린트 범위 (Phase별)

### Phase 2 — Public · Auth
| 대상 | 작업 |
|------|------|
| `(public)/page.tsx` | 섹션 간격·`PageShell`·CTA `BrandButton` |
| `(public)/courses/` | 카드 그리드·`BrandCard`·필터 UI |
| `(public)/exam/` | 신청 플로우 CTA·상태 UI |
| `Navbar.tsx` | active 상태 토큰화, `gray` 제거 |
| `Footer.tsx` | `border-t border-border`, `text-muted-foreground` |
| `(auth)/login/` | 현행 패턴을 Auth 표준으로 문서화 |

### Phase 3 — Classroom · Learner
| 대상 | 작업 |
|------|------|
| `(classroom)/layout.tsx` | `AppSidebar` light variant 추출 |
| `mypage/` | `PageHeader` + 토큰 클래스 |
| `textbooks/` | `PageHeader` + 토큰 클래스 |
| `CoursePackageViewer.tsx` | 탭·진행률 집중 UX |

### Phase 4 — Admin · CMS
| 대상 | 작업 |
|------|------|
| `(admin)/layout.tsx` | 사이드바 톤 결정 후 반영 |
| `admin/courses/page.tsx` | `DataTable` + 필터 바, 대형 파일 분할 |
| `admin/cms/page.tsx` | 하위 컴포넌트 분리 (기능 변경 없음) |
| `admin/banner/page.tsx` | 하위 컴포넌트 분리 |

### Phase 5 — Polish
| 대상 | 작업 |
|------|------|
| `global-error.tsx`, `error.tsx` | 색상 통일, 토큰 적용 |
| `HeroBanner.tsx` | 하드코드 hex → 토큰 |
| 로딩 스피너 | 전역 색상 통일 |

## 마이그레이션 원칙 (필수)

1. **기능 변경 금지** — UI 클래스·컴포넌트 교체만. 로직·API 호출 불변.
2. **토큰 우선** — 새 색상은 `globals.css`에만 추가. 페이지는 Tailwind 클래스 사용.
3. **`ui-page-migrate` 스킬 필수** — 각 페이지 마이그레이션 전 스킬 파일 읽기.
4. **파일당 빌드 검증** — 대형 파일 수정 후 `npm run build` 중간 확인.
5. **기존 코드 확인 우선** — 유사 컴포넌트가 이미 있으면 신규 생성 금지.

## 치환 패턴 (기계적 치환 대상)

```
text-gray-{n}      → text-muted-foreground (보조 텍스트)
bg-gray-{n}        → bg-muted (배경)
border-gray-{n}    → border-border (선)
text-gray-50       → bg-background (밝은 배경)
style={{ color: 'var(--brand-blue)' }}   → className="text-brand-blue"
style={{ color: 'var(--brand-orange)' }} → className="text-brand-orange"
```

> 단순 치환 전: `rg` 검색으로 컨텍스트 확인 후 진행. 의미가 다를 경우 수동 판단.

## 검증 절차

```bash
# 1. 빌드 (필수)
cd frontend
NEXT_PUBLIC_API_URL=http://localhost:4400/api npm run build

# 2. 금지 패턴 잔존 확인
rg "text-gray-|bg-gray-|style=\{.*color" frontend/app/$(AREA) --stats

# 3. 스모크 체크리스트 (수동)
# - 로그인 → 강의 목록 → classroom 진입
# - Admin 대시보드 → 강의 관리
```

## PR 분할 가이드 (`split-to-prs`)

| PR | 범위 |
|----|------|
| PR-1 | 시스템 코어 (PageHeader/PageShell + 파일럿 1~2페이지) |
| PR-2 | Public 홈·about·courses |
| PR-3 | exam·auth·contact |
| PR-4 | Classroom layout + mypage |
| PR-5a | Admin shell + dashboard |
| PR-5b | Admin DataTable + 공통 |
| PR-6 | CMS·banner·courses admin |

## 연계 에이전트·스킬

- 선행: `design-audit` + `design-system` (스펙 완료 필수)
- 스킬: `ui-page-migrate` (페이지별 체크리스트)
- 스킬: `design-system` (금지 패턴·버튼 정책)
- 빌드·CI: `test-ci`
- PR: `split-to-prs`, `babysit`
