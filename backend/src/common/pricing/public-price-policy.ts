/** 공개 API에서 인증된 사용자에게만 금액 필드를 노출한다. */

export function shouldExposePrices(viewerId?: string | null): boolean {
  return !!viewerId;
}

type PriceFields = {
  price?: number | null;
  basePrice?: number | null;
  salePrice?: number | null;
  discountType?: string | null;
  discountValue?: number | null;
  fee?: number | null;
};

export function maskPriceFields<T extends PriceFields>(
  entity: T,
  viewerId?: string | null,
): T {
  if (shouldExposePrices(viewerId)) return entity;
  return {
    ...entity,
    price: null,
    basePrice: null,
    salePrice: null,
    discountType: null,
    discountValue: null,
    fee: null,
  };
}

export function maskCourseForPublic<T extends PriceFields & { courseTextbooks?: Array<{ textbook?: PriceFields | null }> }>(
  course: T,
  viewerId?: string | null,
): T {
  const masked = maskPriceFields(course, viewerId);
  if (shouldExposePrices(viewerId) || !masked.courseTextbooks) return masked;
  return {
    ...masked,
    courseTextbooks: masked.courseTextbooks.map((ct) => ({
      ...ct,
      textbook: ct.textbook ? maskPriceFields(ct.textbook, viewerId) : ct.textbook,
    })),
  };
}

export function maskBookOffersForPublic(
  offers: unknown,
  viewerId?: string | null,
): unknown {
  if (shouldExposePrices(viewerId) || !Array.isArray(offers)) return offers;
  return offers.map((item) =>
    item && typeof item === 'object'
      ? maskPriceFields(item as PriceFields)
      : item,
  );
}
