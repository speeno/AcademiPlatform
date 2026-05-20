# 시험 접수비 3화면 수동 대조 체크리스트

단위 테스트 `pricing-snapshot.spec.ts`의 **PERCENT 할인 (유효기간 내)** 벡터 기준: **81,000원**  
또는 `exam.pricing-consistency.spec.ts` 벡터: base 80,000 / sale 60,000 / 10% → **54,000원**

동일 정책을 관리자에 저장한 뒤 아래 금액이 모두 일치하는지 확인한다.

| # | 화면 | 경로 | 확인 항목 |
|---|------|------|-----------|
| 1 | 관리자 시험 모달 | `/admin/exam` → 회차 편집 | 「최종 응시료」 미리보기 |
| 2 | 공개 시험 목록 | `/exam` | 카드/목록 접수비 (`displayFee`) |
| 3 | 접수 1·2단계 | `/exam/[id]/apply` | `ExamApplySessionSummary` 접수비 |
| 4 | (선택) 결제 | PortOne intent 생성 직전 | intent 금액 = 위와 동일 |

## 절차

1. 관리자에서 테스트 회차에 위 정책 입력 후 저장.
2. 목록 `응시료` 컬럼이 스냅샷과 일치하는지 확인 (`displayFee ?? fee`).
3. 로그인 상태로 `/exam`, 접수 플로우에서 동일 숫자 확인.
4. 유효기간을 미래로 두면 **basePrice**만 노출되는지 재확인 (81,000 → 80,000 등).

## 자동 회귀

```bash
cd backend && npm run test:all
cd frontend && npm run build
```
