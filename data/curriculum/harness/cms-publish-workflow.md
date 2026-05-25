# Harness 강좌 CMS 게시 워크플로

## 목적

- 1차 등록된 DRAFT 콘텐츠를 강사가 수정하고 운영자가 검수/승인하여 수강생에 노출합니다.

## 단계

1. **초안 등록**
   - 임포트 스크립트로 Course/Lesson/ContentItem DRAFT 생성
2. **강사 편집**
   - `/admin/cms`에서 HTML/링크/표기 수정
3. **검수 요청**
   - 레슨별 Review Request 생성
4. **운영 승인**
   - `/admin/cms/review`에서 승인
   - 승인 시 `ContentItem.status=PUBLISHED` + `Lesson.contentStatus=PUBLISHED` 동기화
5. **코호트 검증**
   - 수동 등록 계정으로 `/classroom/{courseId}` 열람 체크

## 운영 규칙

- 과정 상태가 `DRAFT`인 동안은 공개 목록(`/courses`)에 노출되지 않습니다.
- 강좌 공개 전까지 가격은 0/미정으로 유지합니다.
- 실시간 링크(`LIVE_LINK`)는 차수별로 강사가 업데이트합니다.
