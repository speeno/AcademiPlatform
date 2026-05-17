# Design Audit: Classroom · Learner

**경로**: `frontend/app/(classroom)/`, `frontend/components/course-package/`

## P0

| 파일 | 이슈 | 상태 |
|------|------|------|
| error.tsx | h2 인라인 | ✅ |
| mypage/payments | 인라인 color | ✅ PageHeader 적용 |

## P1

| 파일 | 이슈 | 상태 |
|------|------|------|
| layout.tsx | 사이드바 중복 | ✅ AppSidebar light |
| mypage, textbooks, classroom | gray-*, PageHeader | ✅ gray 제거, PageHeader 점진 |
| CoursePackageViewer | 톤 불일치 | ✅ gray→토큰 |
