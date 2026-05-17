# Admin 페이지 분할 패턴

Phase 10에서 확립한 모놀리식 Admin 페이지 분할 가이드라인입니다.

## 원칙

- `page.tsx`는 **200줄 이하**를 목표로 합니다. 오케스트레이션(훅 호출 + JSX 조립)만 담습니다.
- 비즈니스 로직(fetch, state, 핸들러)은 `_use*.ts` 커스텀 훅으로 추출합니다.
- 재사용 가능한 UI 패널은 독립 컴포넌트(`.tsx`)로 분리합니다.
- 공유 타입/상수는 `_types.ts` 파일에 모읍니다. (컴포넌트가 아닌 순수 TS)

## 파일 구조 (폴더 per 페이지)

```
app/(admin)/admin/<feature>/
├── page.tsx              # ≤200줄, 오케스트레이션만
├── _types.ts             # 인터페이스, 상수, 유틸 함수 (export default 없음)
├── _use<Feature>.ts      # 커스텀 훅: 상태 + API 핸들러 모두 포함
└── <FeaturePanel>.tsx    # 독립 UI 패널 (1개 이상 가능)
```

### 적용 사례

| 페이지 | 분할 전 | 분할 후 `page.tsx` | 추출 파일 |
|--------|---------|-------------------|-----------|
| `admin/courses` | 745줄 | 111줄 | `_types.ts`, `_useCoursesAdmin.ts`, `CourseSidebar.tsx`, `CourseModuleEditor.tsx` |
| `admin/cms` | 688줄 | 73줄 | `_types.ts`, `_useCmsWorkspace.ts`, `CmsLessonTree.tsx`, `CmsContentEditor.tsx`, `CmsCollaboratorPanel.tsx` |
| `admin/banner` | 432줄 | 117줄 | `BannerSlideEditor.tsx` |

## 커스텀 훅 규칙

```ts
// _useFeature.ts
'use client';

// 1. 상태 선언
// 2. 파생 값 (useMemo)
// 3. fetch 함수 (useCallback)
// 4. useEffect (부수효과)
// 5. 핸들러 (save, delete 등)
// 6. return { 상태, 핸들러, ref } — 평탄하게 반환
export function useFeature() {
  // ...
  return { data, loading, handleSave, ... };
}
```

## 컴포넌트 Props 규칙

- 상태는 **값(value) + 핸들러(onChange/onXxx)** 패턴으로 전달합니다.
- `Dispatch<SetStateAction<T>>`를 직접 prop으로 내리는 것은 허용하되, UI가 파생 상태를 직접 조작할 때만 사용합니다.
- 컴포넌트 내부에서는 `fetch`를 직접 호출하지 않습니다 — 핸들러는 훅에서 내려받습니다.

## Import 경로 규칙

- `_types.ts`, `_use*.ts`는 **같은 폴더 내 파일에서만** 임포트합니다. `@/app/` 경로로 외부에서 참조하지 않습니다.
- 범용 컴포넌트(UI 패널)가 다른 영역에서도 필요해지면 `frontend/components/admin/`으로 이동합니다.

## 검증 체크리스트

분할 후 다음을 확인합니다.

- [ ] `page.tsx` 줄 수 ≤ 200
- [ ] `npm run build` 통과
- [ ] 해당 Admin 화면 수동 QA (목록 조회 → 생성 → 수정 → 삭제)
- [ ] 기존 기능 회귀 없음 (필터, 페이지네이션, 모달 동작)
