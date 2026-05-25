# 공개/가격 전환 체크리스트

## 전환 전

- [ ] 강좌 상태 `DRAFT`
- [ ] 콘텐츠 검수 승인 완료
- [ ] 코호트 일정(시작/종료) 확정
- [ ] 내부 결재로 가격 확정

## 전환 작업

1. `/admin/courses/{id}`에서 강좌 기본 정보 최신화
2. `PATCH /admin/pricing/COURSE/:id`로 가격 정책 반영
3. `status`를 `UPCOMING` 또는 `ACTIVE`로 변경
4. 필요 시 `enrollmentStartAt`, `enrollmentEndAt`, `maxCapacity` 설정

## 전환 후

- [ ] `/courses` 목록 노출 확인
- [ ] 상세 페이지 가격 표시 확인
- [ ] 수강 등록/결제 흐름 점검
