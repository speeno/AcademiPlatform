import { DiscountType, PriceTargetType } from '@prisma/client';
import { AdminService } from '../src/admin/admin.service';
import { calculatePricingSnapshot } from '../src/common/pricing/pricing-snapshot';

describe('AdminService.updatePricingPolicy (EXAM_SESSION)', () => {
  const baseSession = {
    id: 'session-1',
    qualificationName: 'AI 크리에이터',
    roundName: '1회',
    fee: 80000,
    currency: 'KRW',
    basePrice: 80000,
    salePrice: null,
    discountType: DiscountType.NONE,
    discountValue: 0,
    priceValidFrom: null,
    priceValidUntil: null,
    pricePolicyVersion: 1,
  };

  function makePrisma(current = baseSession) {
    const updated: any = { ...current };
    return {
      examSession: {
        findUnique: jest.fn().mockResolvedValue(current),
        update: jest.fn().mockImplementation(async ({ data }: any) => {
          Object.assign(updated, data);
          return updated;
        }),
      },
      priceHistory: { create: jest.fn().mockResolvedValue({}) },
      capturedUpdate: () =>
        (updated as any) /* 최종 update 결과 */,
    } as any;
  }

  it('PERCENT 할인을 저장하면 fee = calculatePricingSnapshot.finalAmount 가 된다', async () => {
    const prisma = makePrisma();
    const service = new AdminService(prisma);

    await service.updatePricingPolicy(
      PriceTargetType.EXAM_SESSION,
      'session-1',
      {
        basePrice: 80000,
        salePrice: 60000,
        discountType: DiscountType.PERCENT,
        discountValue: 10,
      },
      'admin-1',
    );

    const expected = calculatePricingSnapshot({
      legacyPrice: baseSession.fee,
      basePrice: 80000,
      salePrice: 60000,
      discountType: DiscountType.PERCENT,
      discountValue: 10,
      validFrom: null,
      validUntil: null,
      currency: 'KRW',
      policyVersion: 1,
    }).finalAmount;

    expect(prisma.examSession.update).toHaveBeenCalledTimes(1);
    const dataArg = prisma.examSession.update.mock.calls[0][0].data;
    expect(dataArg.fee).toBe(expected);
    expect(dataArg).not.toHaveProperty('legacyPrice');
    expect(dataArg.pricePolicyVersion).toBe(2);
  });

  it('유효기간 이후 시각이면 fee는 basePrice 기준이 된다 (스냅샷 위임)', async () => {
    const prisma = makePrisma();
    const service = new AdminService(prisma);

    await service.updatePricingPolicy(
      PriceTargetType.EXAM_SESSION,
      'session-1',
      {
        basePrice: 80000,
        salePrice: 60000,
        discountType: DiscountType.PERCENT,
        discountValue: 50,
        priceValidFrom: '2099-01-01T00:00:00.000Z',
        priceValidUntil: '2099-12-31T23:59:59.000Z',
      },
      'admin-1',
    );

    const dataArg = prisma.examSession.update.mock.calls[0][0].data;
    expect(dataArg.fee).toBe(80000);
  });

  it('FIXED 할인을 저장하면 fee = calculatePricingSnapshot.finalAmount 가 된다', async () => {
    const prisma = makePrisma();
    const service = new AdminService(prisma);

    await service.updatePricingPolicy(
      PriceTargetType.EXAM_SESSION,
      'session-1',
      {
        basePrice: 50000,
        salePrice: 40000,
        discountType: DiscountType.FIXED,
        discountValue: 5000,
      },
      'admin-1',
    );

    const expected = calculatePricingSnapshot({
      legacyPrice: baseSession.fee,
      basePrice: 50000,
      salePrice: 40000,
      discountType: DiscountType.FIXED,
      discountValue: 5000,
      validFrom: null,
      validUntil: null,
      currency: 'KRW',
      policyVersion: 1,
    }).finalAmount;

    const dataArg = prisma.examSession.update.mock.calls[0][0].data;
    expect(dataArg.fee).toBe(expected);
    expect(dataArg.fee).toBe(35000);
  });

  it('patch에 누락된 필드는 현재 값을 보존한다 (기존 basePrice/salePrice/유효기간 유지)', async () => {
    const current = {
      ...baseSession,
      basePrice: 70000,
      salePrice: 50000,
      discountType: DiscountType.NONE,
      discountValue: 0,
      priceValidFrom: null,
      priceValidUntil: null,
    };
    const prisma = makePrisma(current);
    const service = new AdminService(prisma);

    await service.updatePricingPolicy(
      PriceTargetType.EXAM_SESSION,
      'session-1',
      { discountType: DiscountType.PERCENT, discountValue: 20 },
      'admin-1',
    );

    const dataArg = prisma.examSession.update.mock.calls[0][0].data;
    expect(dataArg.basePrice).toBe(70000);
    expect(dataArg.salePrice).toBe(50000);
    expect(dataArg.discountType).toBe(DiscountType.PERCENT);
    expect(dataArg.discountValue).toBe(20);
    // 스냅샷 동기화된 legacy fee
    expect(dataArg.fee).toBe(50000 - Math.floor((50000 * 20) / 100));
  });
});
