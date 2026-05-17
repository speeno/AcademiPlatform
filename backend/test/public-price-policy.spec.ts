import {
  maskBookOffersForPublic,
  maskCourseForPublic,
  maskPriceFields,
  shouldExposePrices,
} from '../src/common/pricing/public-price-policy';

describe('public-price-policy', () => {
  it('viewerId 없으면 가격 필드를 null 로 마스킹', () => {
    const masked = maskPriceFields({ fee: 120000, price: 99000 }, undefined);
    expect(masked.fee).toBeNull();
    expect(masked.price).toBeNull();
  });

  it('viewerId 있으면 원본 유지', () => {
    const original = { fee: 120000, price: 99000 };
    expect(maskPriceFields(original, 'user-1')).toEqual(original);
  });

  it('courseTextbooks 내 교재 가격도 마스킹', () => {
    const masked = maskCourseForPublic(
      {
        price: 100,
        courseTextbooks: [{ textbook: { price: 50 } }],
      },
      null,
    );
    expect(masked.price).toBeNull();
    expect(masked.courseTextbooks?.[0]?.textbook?.price).toBeNull();
  });

  it('book_offers 배열 마스킹', () => {
    const offers = [{ id: '1', price: 30000, title: 'A' }];
    const masked = maskBookOffersForPublic(offers, undefined) as typeof offers;
    expect(masked[0].price).toBeNull();
  });

  it('shouldExposePrices', () => {
    expect(shouldExposePrices()).toBe(false);
    expect(shouldExposePrices('u1')).toBe(true);
  });
});
