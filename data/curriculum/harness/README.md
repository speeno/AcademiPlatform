# Harness 커리큘럼 1차 등록 가이드

## 목적

- `/Users/speeno/ai-harness-training-curriculum`의 자료를 AcademiQ에 **DRAFT 강좌 6개**로 1차 등록합니다.
- 가격/오픈은 미정으로 유지하고, 강사가 CMS에서 수정 후 검수/공개합니다.

## 사전 준비

- Backend 실행 환경
- 강좌 오너로 지정할 사용자 ID (`--instructor-id`)
- 커리큘럼 루트 경로(기본값)

## 실행 명령

```bash
cd "/Users/speeno/AcademiPlatform/backend"
npm run curriculum:harness:import -- --instructor-id <USER_ID>
```

### 1일 파일럿만 등록

```bash
cd "/Users/speeno/AcademiPlatform/backend"
npm run curriculum:harness:import -- --instructor-id <USER_ID> --mode pilot-1d
```

### 커리큘럼 루트 변경

```bash
cd "/Users/speeno/AcademiPlatform/backend"
npm run curriculum:harness:import -- --instructor-id <USER_ID> --curriculum-root "/Users/speeno/ai-harness-training-curriculum"
```

## 등록 결과

- `Course` 6개 (status=`DRAFT`, price=`0`)
- `CourseModule`/`Lesson` 골격
- `ContentItem`/`ContentVersion` HTML DRAFT
- 과제 초안(`Assignment`) 생성

## 운영 체크

1. `/admin/courses`에서 강좌 6개 확인
2. `/admin/cms`에서 HTML 콘텐츠 수정
3. `/admin/cms/review` 승인 후 코호트 수동 등록 테스트
4. 공개 전까지 status는 `DRAFT` 유지
