import { DiscountType, ExamSessionStatus } from '@prisma/client';
import { ExamService } from '../src/exam/exam.service';

describe('ExamService displayFee', () => {
  const sessionFixture = {
    id: 'session-1',
    qualificationName: 'AI 크리에이터',
    roundName: '1회',
    applyStartAt: new Date('2026-05-01T00:00:00.000Z'),
    applyEndAt: new Date('2026-05-31T23:59:59.000Z'),
    examAt: new Date('2026-06-15T00:00:00.000Z'),
    place: '서울',
    fee: 80000000,
    currency: 'KRW',
    basePrice: 80000,
    salePrice: null,
    discountType: DiscountType.NONE,
    discountValue: 0,
    priceValidFrom: null,
    priceValidUntil: null,
    pricePolicyVersion: 1,
    capacity: null,
    status: ExamSessionStatus.OPEN,
    guidanceHtml: null,
    relatedCourseId: null,
    createdAt: new Date('2026-05-01T00:00:00.000Z'),
    updatedAt: new Date('2026-05-01T00:00:00.000Z'),
    _count: { applications: 0 },
  };

  it('인증 사용자에게는 계산된 displayFee를 fee로 노출한다', async () => {
    const prisma = {
      examSession: {
        findUnique: jest.fn().mockResolvedValue(sessionFixture),
      },
    } as any;
    const service = new ExamService(prisma);

    const result = await service.findSessionById('session-1', 'user-1');

    expect(result.fee).toBe(80000);
    expect(result.displayFee).toBe(80000);
  });

  it('비인증 사용자에게는 fee/displayFee를 모두 숨긴다', async () => {
    const prisma = {
      examSession: {
        findUnique: jest.fn().mockResolvedValue(sessionFixture),
      },
    } as any;
    const service = new ExamService(prisma);

    const result = await service.findSessionById('session-1');

    expect(result.fee).toBeNull();
    expect(result.displayFee).toBeNull();
  });

  it('관리자 목록(findAllSessions)은 마스킹 없이 raw fee와 함께 스냅샷 displayFee를 노출한다', async () => {
    // legacy fee 컬럼이 오염(80000000)되어도 displayFee는 basePrice 기준 스냅샷(80000)이어야 한다.
    const prisma = {
      examSession: {
        findMany: jest.fn().mockResolvedValue([sessionFixture]),
        count: jest.fn().mockResolvedValue(1),
      },
    } as any;
    const service = new ExamService(prisma);

    const result = await service.findAllSessions({});

    expect(result.total).toBe(1);
    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0].fee).toBe(80000000);
    expect(result.sessions[0].displayFee).toBe(80000);
  });

  it('유효기간 내 PERCENT 할인이 적용된 displayFee를 노출한다', async () => {
    const discountedSession = {
      ...sessionFixture,
      fee: 1,
      basePrice: 80000,
      salePrice: 60000,
      discountType: DiscountType.PERCENT,
      discountValue: 10,
    };
    const prisma = {
      examSession: {
        findUnique: jest.fn().mockResolvedValue(discountedSession),
      },
    } as any;
    const service = new ExamService(prisma);

    const result = await service.findSessionById('session-1', 'user-1');

    expect(result.displayFee).toBe(54000);
    expect(result.fee).toBe(54000);
  });

  it('유효기간 내 FIXED 할인이 적용된 displayFee를 노출한다', async () => {
    const fixedSession = {
      ...sessionFixture,
      fee: 50000,
      basePrice: 50000,
      salePrice: 40000,
      discountType: DiscountType.FIXED,
      discountValue: 5000,
    };
    const prisma = {
      examSession: {
        findUnique: jest.fn().mockResolvedValue(fixedSession),
      },
    } as any;
    const service = new ExamService(prisma);

    const result = await service.findSessionById('session-1', 'user-1');

    expect(result.displayFee).toBe(35000);
    expect(result.fee).toBe(35000);
  });

  it('유효기간 밖에서는 displayFee가 basePrice 기준이 된다 (할인/판매가 미적용)', async () => {
    const outOfWindowSession = {
      ...sessionFixture,
      basePrice: 80000,
      salePrice: 60000,
      discountType: DiscountType.PERCENT,
      discountValue: 10,
      priceValidFrom: new Date('2099-01-01T00:00:00.000Z'),
      priceValidUntil: new Date('2099-12-31T23:59:59.000Z'),
    };
    const prisma = {
      examSession: {
        findUnique: jest.fn().mockResolvedValue(outOfWindowSession),
      },
    } as any;
    const service = new ExamService(prisma);

    const result = await service.findSessionById('session-1', 'user-1');

    expect(result.displayFee).toBe(80000);
    expect(result.fee).toBe(80000);
  });
});
