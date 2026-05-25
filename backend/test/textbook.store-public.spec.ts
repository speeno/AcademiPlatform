import { DiscountType, TextbookStatus } from '@prisma/client';
import { TextbookService } from '../src/textbook/textbook.service';
import { calculatePricingSnapshot } from '../src/common/pricing/pricing-snapshot';

/**
 * P1 회귀 방지: 공개 스토어 목록(`findStorePublic`) 가격 마스킹 + 스냅샷 일관성.
 * - 비로그인: `displayFee` / 가격 필드 모두 null (마스킹)
 * - 로그인: `displayFee = calculatePricingSnapshot.finalAmount`, `hasAccess` 계산
 * - findStore(인증 필수)와 동일한 정책 스냅샷을 공유해 결제·UI·관리자 화면 간 가격 일관성을 유지한다.
 */
describe('TextbookService.findStorePublic (P1)', () => {
  const baseBook = {
    id: 'book-1',
    title: '단독 교재',
    description: 'standalone',
    coverImageUrl: null,
    totalPages: 120,
    price: 1, // legacy 컬럼 오염 시뮬
    currency: 'KRW',
    basePrice: 80000,
    salePrice: 60000,
    discountType: DiscountType.PERCENT,
    discountValue: 10,
    priceValidFrom: null,
    priceValidUntil: null,
    pricePolicyVersion: 1,
    isStandalone: true,
    status: TextbookStatus.PUBLISHED,
    createdAt: new Date('2026-05-01T00:00:00.000Z'),
  };

  const config = {
    get: (key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      return undefined;
    },
  };

  const buildService = (
    findManyResult: any[],
    accessResult: { textbookId: string }[] = [],
  ) => {
    const prisma = {
      textbook: {
        findMany: jest.fn().mockResolvedValue(findManyResult),
      },
      textbookAccess: {
        findMany: jest.fn().mockResolvedValue(accessResult),
      },
    } as any;
    const service = new TextbookService(prisma, config as any);
    return { service, prisma };
  };

  it('비로그인 사용자에게는 displayFee/가격 필드를 모두 마스킹한다', async () => {
    const { service, prisma } = buildService([baseBook]);
    const result = await service.findStorePublic();

    expect(result).toHaveLength(1);
    expect(result[0].displayFee).toBeNull();
    expect(result[0].price).toBeNull();
    expect(result[0].basePrice).toBeNull();
    expect(result[0].salePrice).toBeNull();
    expect(result[0].discountType).toBeNull();
    expect(result[0].hasAccess).toBe(false);
    expect(prisma.textbookAccess.findMany).not.toHaveBeenCalled();
  });

  it('로그인 사용자에게는 calculatePricingSnapshot.finalAmount를 displayFee로 노출한다', async () => {
    const expectedFinal = calculatePricingSnapshot({
      legacyPrice: baseBook.price,
      basePrice: baseBook.basePrice,
      salePrice: baseBook.salePrice,
      discountType: baseBook.discountType,
      discountValue: baseBook.discountValue,
      validFrom: baseBook.priceValidFrom,
      validUntil: baseBook.priceValidUntil,
      currency: baseBook.currency,
      policyVersion: baseBook.pricePolicyVersion,
    }).finalAmount;

    const { service, prisma } = buildService([baseBook]);
    const result = await service.findStorePublic('user-1');

    expect(result[0].displayFee).toBe(expectedFinal);
    expect(result[0].displayFee).toBe(54000);
    expect(result[0].price).toBe(baseBook.price);
    expect(result[0].basePrice).toBe(baseBook.basePrice);
    expect(result[0].hasAccess).toBe(false);
    expect(prisma.textbookAccess.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', revokedAt: null },
      select: { textbookId: true },
    });
  });

  it('로그인 사용자가 보유한 교재는 hasAccess=true를 노출한다', async () => {
    const otherBook = { ...baseBook, id: 'book-2', title: '미보유 교재' };
    const { service } = buildService(
      [baseBook, otherBook],
      [{ textbookId: 'book-1' }],
    );

    const result = await service.findStorePublic('user-1');

    const owned = result.find((b: any) => b.id === 'book-1');
    const notOwned = result.find((b: any) => b.id === 'book-2');
    expect(owned?.hasAccess).toBe(true);
    expect(notOwned?.hasAccess).toBe(false);
  });

  it('할인 유효기간 밖이면 displayFee가 basePrice 기준이 된다', async () => {
    const outOfWindow = {
      ...baseBook,
      priceValidFrom: new Date('2099-01-01T00:00:00.000Z'),
      priceValidUntil: new Date('2099-12-31T23:59:59.000Z'),
    };
    const { service } = buildService([outOfWindow]);
    const result = await service.findStorePublic('user-1');

    expect(result[0].displayFee).toBe(80000);
  });

  it('비로그인 + 보유 사용자 없는 경우 textbookAccess.findMany 호출을 생략한다', async () => {
    const { service, prisma } = buildService([baseBook]);
    await service.findStorePublic();
    expect(prisma.textbookAccess.findMany).not.toHaveBeenCalled();
  });
});

describe('TextbookService.findByIdPublic (P2)', () => {
  const baseBook = {
    id: 'book-1',
    title: '단독 교재',
    description: 'standalone detail',
    coverImageUrl: null,
    totalPages: 120,
    price: 1,
    currency: 'KRW',
    basePrice: 50000,
    salePrice: null,
    discountType: null,
    discountValue: 0,
    priceValidFrom: null,
    priceValidUntil: null,
    pricePolicyVersion: 1,
    isStandalone: true,
  };

  const buildDetailService = (book: typeof baseBook, hasAccess: boolean) => {
    const prisma = {
      textbook: {
        findUnique: jest.fn().mockResolvedValue(book),
      },
      textbookAccess: {
        findFirst: jest
          .fn()
          .mockResolvedValue(hasAccess ? { id: 'access-1' } : null),
      },
    } as any;
    const config = {
      get: (key: string) => (key === 'JWT_SECRET' ? 'test-secret' : undefined),
    };
    return { service: new TextbookService(prisma, config as any), prisma };
  };

  it('비로그인 시 displayFee가 null이다', async () => {
    const { service } = buildDetailService(baseBook, false);
    const result = await service.findByIdPublic('book-1');
    expect(result.displayFee).toBeNull();
    expect(result.hasAccess).toBe(false);
  });

  it('로그인·보유 시 hasAccess가 true이다', async () => {
    const { service } = buildDetailService(baseBook, true);
    const result = await service.findByIdPublic('book-1', 'user-1');
    expect(result.hasAccess).toBe(true);
    expect(result.displayFee).toBe(50000);
  });

  it('isStandalone이 아니면 404', async () => {
    const { service } = buildDetailService(
      { ...baseBook, isStandalone: false },
      false,
    );
    await expect(service.findByIdPublic('book-1')).rejects.toThrow(
      '교재를 찾을 수 없습니다',
    );
  });
});
