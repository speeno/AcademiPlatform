# 1일 2트랙 파일럿 코호트 E2E Runbook

## 대상

- 비개발 1일 (`harness-nondev-1d`)
- 개발 1일 (`harness-dev-1d`)

## 사전 점검

- [ ] 강좌 상태 `DRAFT` 유지
- [ ] CMS 승인 완료(파일럿에 필요한 레슨만)
- [ ] 수동 등록 대상 사용자 ID 목록 준비
- [ ] 라이브 세션 URL 입력 완료

## 운영 절차

1. 운영자: `/admin/courses/{id}/enrollments`에서 수강생 수동 등록
2. 강사: `/admin/cms`에서 당일 슬라이드 최종 확인
3. 수강생: `/classroom/{courseId}` 접속 확인
4. 수강생: `/classroom/{courseId}/assignments` 과제 제출
5. 강사/운영자: `/admin/courses/{id}/assignments` 제출물 피드백

## 성공 기준

- [ ] 수강생이 슬라이드/라이브 안내를 열람할 수 있다
- [ ] 과제 제출/피드백이 왕복된다
- [ ] 진도(`progressRate`)가 정상 반영된다
- [ ] 코호트 종료 후 운영 회고 문서를 남긴다

## 종료 후 액션

- 오탈자/링크 오류 CMS 수정
- 다음 차수용 마감일(dueAt) 재설정
- 공개 전환 필요 시 가격/상태 변경 준비
