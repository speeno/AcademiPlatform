import { DiscountType } from '@prisma/client';
import { PaymentService } from '../src/payment/payment.service';

describe('PaymentService pricing snapshot', () => {
  const service = new PaymentService(
    {} as any,
    { get: () => '' } as any,
    {} as any,
  );

  it('PERCENT 할인 계산이 정확해야 한다', () => {
    const result = (service as any).calculatePricingSnapshot({
      legacyPrice: 100000,
      basePrice: 100000,
      salePrice: 90000,
      discountType: DiscountType.PERCENT,
      discountValue: 10,
      validFrom: null,
      validUntil: null,
      currency: 'KRW',
      policyVersion: 1,
    });

    expect(result.baseAmount).toBe(100000);
    expect(result.discountAmount).toBe(9000);
    expect(result.finalAmount).toBe(81000);
  });

  it('유효기간 외에는 할인 미적용이어야 한다', () => {
    const result = (service as any).calculatePricingSnapshot({
      legacyPrice: 50000,
      basePrice: 50000,
      salePrice: 40000,
      discountType: DiscountType.FIXED,
      discountValue: 5000,
      validFrom: new Date(Date.now() + 1000 * 60 * 60),
      validUntil: new Date(Date.now() + 1000 * 60 * 60 * 2),
      currency: 'KRW',
      policyVersion: 2,
    });

    expect(result.discountAmount).toBe(0);
    expect(result.finalAmount).toBe(50000);
  });
});
