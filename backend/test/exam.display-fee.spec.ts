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
});
