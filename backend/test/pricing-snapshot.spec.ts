import { DiscountType } from '@prisma/client';
import { calculatePricingSnapshot } from '../src/common/pricing/pricing-snapshot';

/** 프론트 `frontend/lib/pricing-snapshot.ts`와 동일 벡터로 수동·회귀 대조용 */
export const PRICING_SNAPSHOT_GOLDEN_VECTORS = [
  {
    label: 'PERCENT 할인 (유효기간 내)',
    input: {
      legacyPrice: 100000,
      basePrice: 100000,
      salePrice: 90000,
      discountType: DiscountType.PERCENT,
      discountValue: 10,
      validFrom: null,
      validUntil: null,
      currency: 'KRW',
      policyVersion: 1,
    },
    expected: { baseAmount: 100000, discountAmount: 9000, finalAmount: 81000 },
  },
  {
    label: 'FIXED 할인 (유효기간 내)',
    input: {
      legacyPrice: 50000,
      basePrice: 50000,
      salePrice: 40000,
      discountType: DiscountType.FIXED,
      discountValue: 5000,
      validFrom: null,
      validUntil: null,
      currency: 'KRW',
      policyVersion: 1,
    },
    expected: { baseAmount: 50000, discountAmount: 5000, finalAmount: 35000 },
  },
  {
    label: '유효기간 밖 (할인·판매가 미적용)',
    input: {
      legacyPrice: 80000,
      basePrice: 80000,
      salePrice: 60000,
      discountType: DiscountType.PERCENT,
      discountValue: 50,
      validFrom: new Date('2099-01-01T00:00:00.000Z'),
      validUntil: new Date('2099-12-31T23:59:59.000Z'),
      currency: 'KRW',
      policyVersion: 1,
    },
    expected: { baseAmount: 80000, discountAmount: 0, finalAmount: 80000 },
  },
  {
    label: 'basePrice=0 이면 legacyPrice 기준',
    input: {
      legacyPrice: 650000,
      basePrice: 0,
      salePrice: null,
      discountType: DiscountType.NONE,
      discountValue: 0,
      validFrom: null,
      validUntil: null,
      currency: 'KRW',
      policyVersion: 1,
    },
    expected: { baseAmount: 650000, discountAmount: 0, finalAmount: 650000 },
  },
] as const;

describe('calculatePricingSnapshot', () => {
  it.each(PRICING_SNAPSHOT_GOLDEN_VECTORS)(
    '$label',
    ({ input, expected }) => {
      const result = calculatePricingSnapshot(input);
      expect(result.baseAmount).toBe(expected.baseAmount);
      expect(result.discountAmount).toBe(expected.discountAmount);
      expect(result.finalAmount).toBe(expected.finalAmount);
    },
  );

  it('NONE 할인은 salePrice(없으면 basePrice)를 그대로 반환한다', () => {
    const result = calculatePricingSnapshot({
      legacyPrice: 99,
      basePrice: 80000,
      salePrice: 75000,
      discountType: DiscountType.NONE,
      discountValue: 0,
      validFrom: null,
      validUntil: null,
      currency: 'KRW',
      policyVersion: 2,
    });
    expect(result.finalAmount).toBe(75000);
    expect(result.discountAmount).toBe(0);
  });
});
