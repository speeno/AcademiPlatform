import {
  DiscountType,
  ExamApplicationStatus,
  PaymentTarget,
} from '@prisma/client';
import { calculatePricingSnapshot } from '../src/common/pricing/pricing-snapshot';
import { ExamService } from '../src/exam/exam.service';
import { PaymentPricingService } from '../src/payment/services/payment-pricing.service';

/**
 * 관리자 모달·공개 목록·접수·결제 intent가 동일한 `finalAmount`를 쓰는지 단위로 고정한다.
 * (3화면 수동 대조 시 이 벡터의 숫자와 UI 표시가 일치해야 함)
 */
describe('시험 접수비 단일 스냅샷 (ExamService ↔ PaymentPricingService)', () => {
  const policy = {
    fee: 1,
    currency: 'KRW',
    basePrice: 80000,
    salePrice: 60000,
    discountType: DiscountType.PERCENT,
    discountValue: 10,
    priceValidFrom: null,
    priceValidUntil: null,
    pricePolicyVersion: 1,
  };

  const expectedFinal = calculatePricingSnapshot({
    legacyPrice: policy.fee,
    basePrice: policy.basePrice,
    salePrice: policy.salePrice,
    discountType: policy.discountType,
    discountValue: policy.discountValue,
    validFrom: policy.priceValidFrom,
    validUntil: policy.priceValidUntil,
    currency: policy.currency,
    policyVersion: policy.pricePolicyVersion,
  }).finalAmount;

  it('findSessionById displayFee = 스냅샷 finalAmount', async () => {
    const session = {
      id: 'session-1',
      qualificationName: 'AI',
      roundName: '1회',
      applyStartAt: new Date(),
      applyEndAt: new Date(),
      examAt: new Date(),
      place: '서울',
      ...policy,
      capacity: null,
      status: 'OPEN' as const,
      guidanceHtml: null,
      relatedCourseId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { applications: 0 },
    };
    const prisma = {
      examSession: { findUnique: jest.fn().mockResolvedValue(session) },
    } as any;
    const exam = new ExamService(prisma);

    const result = await exam.findSessionById('session-1', 'user-1');

    expect(result.displayFee).toBe(expectedFinal);
    expect(result.fee).toBe(expectedFinal);
    expect(expectedFinal).toBe(54000);
  });

  it('resolveTargetPricing(EXAM_APPLICATION) finalAmount = displayFee', async () => {
    const prisma = {
      examApplication: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'app-1',
          userId: 'user-1',
          status: ExamApplicationStatus.PAYMENT_PENDING,
          examSession: { qualificationName: 'AI', roundName: '1회', ...policy },
        }),
      },
    } as any;
    const pricing = new PaymentPricingService(prisma);

    const resolved = await pricing.resolveTargetPricing(
      'user-1',
      PaymentTarget.EXAM_APPLICATION,
      'app-1',
    );

    expect(resolved.finalAmount).toBe(expectedFinal);
    expect(resolved.finalAmount).toBe(54000);
  });
});
