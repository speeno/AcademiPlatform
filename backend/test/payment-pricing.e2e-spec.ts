import { DiscountType } from '@prisma/client';
import { PaymentService } from '../src/payment/payment.service';

describe('Payment pricing regression (e2e style)', () => {
  it('가격 정책 계산 결과가 음수가 되지 않아야 한다', () => {
    const service = new PaymentService({} as any, { get: () => '' } as any, {} as any);
    const result = (service as any).calculatePricingSnapshot({
      legacyPrice: 10000,
      basePrice: 10000,
      salePrice: 5000,
      discountType: DiscountType.FIXED,
      discountValue: 99999,
      validFrom: null,
      validUntil: null,
      currency: 'KRW',
      policyVersion: 1,
    });
    expect(result.finalAmount).toBe(0);
  });
});
