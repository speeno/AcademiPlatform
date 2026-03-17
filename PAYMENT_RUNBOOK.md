# PAYMENT RUNBOOK

## 목적
- 결제/환불/웹훅 장애 발생 시 운영자가 빠르게 원인 파악 및 복구할 수 있도록 표준 절차를 제공한다.

## 필수 환경변수
- `PORTONE_API_KEY`
- `PORTONE_API_SECRET`
- `PORTONE_IMP_CODE`
- `PAYMENT_ALERT_WEBHOOK_URL` (선택, 운영 알림용)

## 일일 점검
- 관리자 결제 목록에서 `PENDING` 장기 체류 건 확인
- 웹훅 처리 실패 로그(`webhook verification failed`) 확인
- 환불 처리 실패 로그(`refund failed`) 확인

## 장애 유형별 대응

### 1) 결제 생성 실패 (`/payments/orders`)
- 확인 항목
  - 대상 ID 유효성(강의/교재/시험 신청) 존재 여부
  - 가격 정책 유효기간 만료 여부
  - 사용자 소유 여부(이미 구매/수강)
- 조치
  - 관리자에서 가격 정책/대상 상태 확인
  - 필요 시 정책 수정 후 재시도

### 2) 결제 검증 실패 (`/payments/verify`)
- 확인 항목
  - PortOne `imp_uid` 유효성
  - 서버 계산 금액과 PortOne 결제 금액 일치 여부
  - 동일 주문 중복 검증 여부
- 조치
  - 실패 주문은 `FAILED` 상태로 남기고 신규 결제 재시도 안내
  - 위변조 의심 시 계정/요청 IP 점검

### 3) 웹훅 반영 실패 (`/payments/webhook`)
- 확인 항목
  - `merchant_uid`가 서버 주문번호와 매칭되는지
  - PortOne 재검증 성공 여부
- 조치
  - 주문 상태가 `PENDING`이면 관리자 검증 API로 수동 재처리
  - 중복/위조 요청은 무시

### 4) 환불 실패
- 확인 항목
  - `pgTxId` 존재 여부
  - PortOne 취소 API 응답 코드/메시지
- 조치
  - PortOne 관리자 콘솔에서 거래 상태 확인
  - 환불 성공 후 앱 상태(`REFUNDED`)와 권한 회수 상태 일치 검증

## 수동 복구 절차
- 강의: `Enrollment.status=REFUNDED` + 연동 교재권한 `revokedAt` 갱신
- 시험: `ExamApplication.status=REFUNDED`, `paymentStatus=REFUNDED`
- 교재: `TextbookAccess`(PURCHASE/sourceId=paymentId) 회수

## 배포 전 체크
- `npx prisma migrate deploy`
- 백엔드/프론트 빌드 성공
- 테스트 결제(성공/실패/취소) 시나리오 1회 이상 검증
