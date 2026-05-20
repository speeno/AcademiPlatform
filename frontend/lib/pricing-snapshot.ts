// 백엔드 `backend/src/common/pricing/pricing-snapshot.ts`와 동일한 가격 산출 공식.
// 관리자 모달의 미리보기/시뮬레이션이 공개 화면·결제에서 실제로 노출될 금액과 항상 일치하도록
// 동일 로직을 프론트엔드에서도 공유한다. 두 파일이 함께 변경되어야 한다는 주석을 남긴다.
// 변경 시 `backend/src/common/pricing/pricing-snapshot.ts`도 같이 검토하세요.

export type DiscountType = 'NONE' | 'PERCENT' | 'FIXED';

export interface PricingSnapshotInput {
  legacyPrice: number;
  basePrice: number;
  salePrice: number | null;
  discountType: DiscountType;
  discountValue: number;
  validFrom: Date | null;
  validUntil: Date | null;
  /** 테스트/SSR에서 고정된 시각을 주입하기 위한 옵션. 미설정 시 `Date.now()` 사용 */
  now?: Date;
}

export interface PricingSnapshotResult {
  baseAmount: number;
  preDiscount: number;
  discountAmount: number;
  finalAmount: number;
  isInValidWindow: boolean;
}

export function calculatePricingSnapshot(
  input: PricingSnapshotInput,
): PricingSnapshotResult {
  const now = (input.now ?? new Date()).getTime();
  const isInValidWindow =
    (!input.validFrom || now >= input.validFrom.getTime()) &&
    (!input.validUntil || now <= input.validUntil.getTime());

  const baseAmount = input.basePrice > 0 ? input.basePrice : input.legacyPrice;
  const saleCandidate = input.salePrice ?? baseAmount;
  const preDiscount = isInValidWindow ? saleCandidate : baseAmount;

  let discountAmount = 0;
  if (isInValidWindow && input.discountType === 'PERCENT') {
    discountAmount = Math.floor(
      (preDiscount * Math.max(0, input.discountValue)) / 100,
    );
  } else if (isInValidWindow && input.discountType === 'FIXED') {
    discountAmount = Math.max(0, input.discountValue);
  }

  const finalAmount = Math.max(0, preDiscount - discountAmount);

  return { baseAmount, preDiscount, discountAmount, finalAmount, isInValidWindow };
}
