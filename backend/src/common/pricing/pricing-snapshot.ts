import { DiscountType } from '@prisma/client';

export interface PricingSnapshotInput {
  legacyPrice: number;
  basePrice: number;
  salePrice: number | null;
  discountType: DiscountType;
  discountValue: number;
  validFrom: Date | null;
  validUntil: Date | null;
  currency: string;
  policyVersion: number;
}

export interface PricingSnapshotResult {
  currency: string;
  baseAmount: number;
  discountAmount: number;
  finalAmount: number;
  pricePolicyVersion: number;
}

/**
 * 가격 정책(basePrice/salePrice/할인 윈도) 스냅샷 계산.
 * - PaymentService.resolveTargetPricing 과 CoursesService.enroll(결제 검증)이 동일 로직을 공유한다.
 * - 유료/무료 판별은 `finalAmount > 0` 기준으로 통일.
 */
export function calculatePricingSnapshot(
  input: PricingSnapshotInput,
): PricingSnapshotResult {
  const now = Date.now();
  const isInValidWindow =
    (!input.validFrom || now >= input.validFrom.getTime()) &&
    (!input.validUntil || now <= input.validUntil.getTime());

  const baseAmount = input.basePrice > 0 ? input.basePrice : input.legacyPrice;
  const saleCandidate = input.salePrice ?? baseAmount;
  const preDiscount = isInValidWindow ? saleCandidate : baseAmount;

  let discountAmount = 0;
  if (isInValidWindow && input.discountType === DiscountType.PERCENT) {
    discountAmount = Math.floor(
      (preDiscount * Math.max(0, input.discountValue)) / 100,
    );
  } else if (isInValidWindow && input.discountType === DiscountType.FIXED) {
    discountAmount = Math.max(0, input.discountValue);
  }
  const finalAmount = Math.max(0, preDiscount - discountAmount);

  return {
    currency: input.currency || 'KRW',
    baseAmount,
    discountAmount,
    finalAmount,
    pricePolicyVersion: input.policyVersion ?? 1,
  };
}
