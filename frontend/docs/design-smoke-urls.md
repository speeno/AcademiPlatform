# 디자인 스모크 체크리스트

Phase 11 완료 기준에 따른 수동 QA URL 목록입니다.

## Public (12 URL)

| # | URL | 확인 포인트 |
|---|-----|-----------|
| 1 | `/` | 히어로 배너, 섹션 레이아웃, CTA 버튼 |
| 2 | `/courses` | 강좌 목록 카드 그리드, 필터 |
| 3 | `/courses/[slug]` | 강좌 상세, 커리큘럼 섹션, EnrollButton |
| 4 | `/exam` | 시험 회차 목록 카드, 자격 소개 섹션 |
| 5 | `/exam/[id]/apply` | 단계 UI, 요약 카드, 결제 버튼 |
| 6 | `/about` | PageShell 레이아웃, 카드 그리드, CTA |
| 7 | `/about/fields` | 분야 목록, 디자인 토큰 색상 |
| 8 | `/notices` | 공지사항 목록, 고정 공지 스타일 |
| 9 | `/notices/[id]` | 공지 상세 본문 |
| 10 | `/faq` | FAQ 아코디언 |
| 11 | `/privacy` | 법적 문서 레이아웃 |
| 12 | `/terms` | 법적 문서 레이아웃 |

## Auth (3 URL)

| # | URL | 확인 포인트 |
|---|-----|-----------|
| 13 | `/login` | BrandCard, 폼 스타일, BrandButton |
| 14 | `/register` | login과 동일 패턴 |
| 15 | `/forgot-password` | login과 동일 패턴 |

## Classroom (3 URL)

| # | URL | 확인 포인트 |
|---|-----|-----------|
| 16 | `/classroom` | PageHeader, 수강 카드 그리드, 진행률 |
| 17 | `/classroom/[courseId]` | 좌측 목차, 동영상 플레이어, 탭 전환 |
| 18 | `/mypage` | 프로필 카드, 수강 정보 섹션 |

## Admin (3 URL)

| # | URL | 확인 포인트 |
|---|-----|-----------|
| 19 | `/admin/dashboard` | 집계 카드, 최근 활동 |
| 20 | `/admin/users` | DataTable, PageHeader, 검색/필터 |
| 21 | `/admin/courses` | 좌측 사이드바, 폼 패널, 모듈/레슨 CRUD |

## 전환 경로 스모크 (순서대로)

```
홈(/) → 강좌 목록(/courses) → 강좌 상세(/courses/[slug]) → 시험 신청(/exam/[id]/apply) → 로그인(/login) → 결제 완료(/mypage/payments)
```

## CI 검증 명령

```bash
cd frontend && NEXT_PUBLIC_API_URL=http://localhost:4400/api npm run build
```
