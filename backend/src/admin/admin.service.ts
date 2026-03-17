import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  DiscountType,
  InquiryStatus,
  PriceTargetType,
  UserRole,
  UserStatus,
} from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  /* 대시보드 통계 */
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [newUsers, todayPayments, enrollments, examApps, openInquiries] = await Promise.all([
      this.prisma.user.count({ where: { createdAt: { gte: today } } }),
      this.prisma.payment.aggregate({
        where: { createdAt: { gte: today }, paymentStatus: 'PAID' },
        _sum: { finalAmount: true },
        _count: true,
      }),
      this.prisma.enrollment.count({ where: { enrolledAt: { gte: today } } }),
      this.prisma.examApplication.count({ where: { appliedAt: { gte: today } } }),
      this.prisma.inquiry.count({ where: { status: InquiryStatus.OPEN } }),
    ]);

    return {
      newUsers,
      todayPaymentAmount: todayPayments._sum.finalAmount ?? 0,
      todayPaymentCount: todayPayments._count,
      enrollments,
      examApps,
      openInquiries,
    };
  }

  /* 회원 관리 */
  async getUsers(filter: { search?: string; status?: UserStatus; role?: UserRole; page?: number; limit?: number }) {
    const { search, status, role, page = 1, limit = 20 } = filter;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (role) where.role = role;
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, name: true, phone: true,
          role: true, status: true, createdAt: true,
          _count: { select: { enrollments: true, payments: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { users, total, page, limit };
  }

  async updateUserStatus(userId: string, status: UserStatus) {
    return this.prisma.user.update({ where: { id: userId }, data: { status } });
  }

  /* 공지사항 */
  async createNotice(data: {
    title: string; content: string; isPinned?: boolean;
    isPublished?: boolean; scopeType?: 'GLOBAL' | 'COURSE'; scopeId?: string;
  }) {
    return this.prisma.notice.create({
      data: {
        ...data,
        publishedAt: data.isPublished ? new Date() : undefined,
      },
    });
  }

  async getNotices(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notices, total] = await Promise.all([
      this.prisma.notice.findMany({
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.notice.count(),
    ]);
    return { notices, total, page, limit };
  }

  async updateNotice(id: string, data: any) {
    return this.prisma.notice.update({ where: { id }, data });
  }

  async deleteNotice(id: string) {
    return this.prisma.notice.delete({ where: { id } });
  }

  /* FAQ */
  async createFaq(data: { category: string; question: string; answer: string; sortOrder?: number }) {
    return this.prisma.faq.create({ data });
  }

  async getFaqs(category?: string) {
    return this.prisma.faq.findMany({
      where: { isPublished: true, ...(category ? { category } : {}) },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  async updateFaq(id: string, data: any) {
    return this.prisma.faq.update({ where: { id }, data });
  }

  async deleteFaq(id: string) {
    return this.prisma.faq.delete({ where: { id } });
  }

  /* 1:1 문의 */
  async getInquiries(filter: { status?: InquiryStatus; page?: number; limit?: number }) {
    const { status, page = 1, limit = 20 } = filter;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    const [inquiries, total] = await Promise.all([
      this.prisma.inquiry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.inquiry.count({ where }),
    ]);
    return { inquiries, total, page, limit };
  }

  async respondInquiry(id: string, response: string) {
    return this.prisma.inquiry.update({
      where: { id },
      data: {
        response,
        respondedAt: new Date(),
        status: InquiryStatus.CLOSED,
      },
    });
  }

  /* 운영 로그 */
  async getAuditLogs(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.auditLog.count(),
    ]);
    return { logs, total, page, limit };
  }

  /* 시스템 설정 */
  async getSettings() {
    const settings = await this.prisma.systemSetting.findMany();
    return Object.fromEntries(settings.map((s) => [s.key, s.value]));
  }

  async updateSetting(key: string, value: string) {
    return this.prisma.systemSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }

  async updatePricingPolicy(
    targetType: PriceTargetType,
    targetId: string,
    data: {
      currency?: string;
      basePrice?: number;
      salePrice?: number | null;
      discountType?: DiscountType;
      discountValue?: number;
      priceValidFrom?: string | null;
      priceValidUntil?: string | null;
      reason?: string;
    },
    changedById: string,
  ) {
    const patch = this.normalizePricingPatch(data);
    if (!patch) {
      throw new NotFoundException('변경할 가격 정책 값이 없습니다.');
    }

    if (targetType === PriceTargetType.COURSE) {
      const current = await this.prisma.course.findUnique({ where: { id: targetId } });
      if (!current) throw new NotFoundException('강의를 찾을 수 없습니다.');
      const next = this.applyPolicyToLegacyPrice(current.price, patch);
      const updated = await this.prisma.course.update({
        where: { id: targetId },
        data: {
          ...next,
          price: next.legacyPrice,
          pricePolicyVersion: current.pricePolicyVersion + 1,
        },
      });
      await this.createPriceHistory(targetType, targetId, changedById, data.reason, current, updated);
      return updated;
    }

    if (targetType === PriceTargetType.EXAM_SESSION) {
      const current = await this.prisma.examSession.findUnique({ where: { id: targetId } });
      if (!current) throw new NotFoundException('시험 회차를 찾을 수 없습니다.');
      const next = this.applyPolicyToLegacyPrice(current.fee, patch);
      const updated = await this.prisma.examSession.update({
        where: { id: targetId },
        data: {
          ...next,
          fee: next.legacyPrice,
          pricePolicyVersion: current.pricePolicyVersion + 1,
        },
      });
      await this.createPriceHistory(targetType, targetId, changedById, data.reason, current, updated);
      return updated;
    }

    const current = await this.prisma.textbook.findUnique({ where: { id: targetId } });
    if (!current) throw new NotFoundException('교재를 찾을 수 없습니다.');
    const next = this.applyPolicyToLegacyPrice(current.price, patch);
    const updated = await this.prisma.textbook.update({
      where: { id: targetId },
      data: {
        ...next,
        price: next.legacyPrice,
        pricePolicyVersion: current.pricePolicyVersion + 1,
      },
    });
    await this.createPriceHistory(targetType, targetId, changedById, data.reason, current, updated);
    return updated;
  }

  async getPricingHistory(filter: {
    targetType?: PriceTargetType;
    targetId?: string;
    changedById?: string;
    page?: number;
    limit?: number;
  }) {
    const { targetType, targetId, changedById, page = 1, limit = 20 } = filter;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (targetType) where.targetType = targetType;
    if (targetId) where.targetId = targetId;
    if (changedById) where.changedById = changedById;

    const [items, total] = await Promise.all([
      this.prisma.priceHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.priceHistory.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  private normalizePricingPatch(data: {
    currency?: string;
    basePrice?: number;
    salePrice?: number | null;
    discountType?: DiscountType;
    discountValue?: number;
    priceValidFrom?: string | null;
    priceValidUntil?: string | null;
  }) {
    const patch: any = {};
    if (typeof data.currency === 'string' && data.currency.trim()) patch.currency = data.currency.trim();
    if (typeof data.basePrice === 'number') patch.basePrice = Math.max(0, Math.floor(data.basePrice));
    if (typeof data.salePrice === 'number') patch.salePrice = Math.max(0, Math.floor(data.salePrice));
    if (data.salePrice === null) patch.salePrice = null;
    if (typeof data.discountType === 'string') patch.discountType = data.discountType;
    if (typeof data.discountValue === 'number') patch.discountValue = Math.max(0, Math.floor(data.discountValue));
    if (typeof data.priceValidFrom === 'string') patch.priceValidFrom = new Date(data.priceValidFrom);
    if (data.priceValidFrom === null) patch.priceValidFrom = null;
    if (typeof data.priceValidUntil === 'string') patch.priceValidUntil = new Date(data.priceValidUntil);
    if (data.priceValidUntil === null) patch.priceValidUntil = null;
    return Object.keys(patch).length > 0 ? patch : null;
  }

  private applyPolicyToLegacyPrice(
    currentLegacyPrice: number,
    patch: {
      currency?: string;
      basePrice?: number;
      salePrice?: number | null;
      discountType?: DiscountType;
      discountValue?: number;
      priceValidFrom?: Date | null;
      priceValidUntil?: Date | null;
    },
  ) {
    const basePrice = patch.basePrice ?? currentLegacyPrice;
    const salePrice = patch.salePrice ?? basePrice;
    const discountType = patch.discountType ?? DiscountType.NONE;
    const discountValue = patch.discountValue ?? 0;
    let discountAmount = 0;
    if (discountType === DiscountType.PERCENT) {
      discountAmount = Math.floor((salePrice * discountValue) / 100);
    } else if (discountType === DiscountType.FIXED) {
      discountAmount = discountValue;
    }
    const finalPrice = Math.max(0, salePrice - discountAmount);

    return {
      ...patch,
      basePrice,
      salePrice,
      discountType,
      discountValue,
      legacyPrice: finalPrice,
    };
  }

  private async createPriceHistory(
    targetType: PriceTargetType,
    targetId: string,
    changedById: string,
    reason: string | undefined,
    oldItem: any,
    newItem: any,
  ) {
    await this.prisma.priceHistory.create({
      data: {
        targetType,
        targetId,
        changedById,
        reason,
        currency: newItem.currency ?? oldItem.currency ?? 'KRW',
        oldBasePrice: oldItem.basePrice,
        oldSalePrice: oldItem.salePrice,
        oldDiscountType: oldItem.discountType,
        oldDiscountValue: oldItem.discountValue,
        oldValidFrom: oldItem.priceValidFrom,
        oldValidUntil: oldItem.priceValidUntil,
        oldPolicyVersion: oldItem.pricePolicyVersion,
        newBasePrice: newItem.basePrice,
        newSalePrice: newItem.salePrice,
        newDiscountType: newItem.discountType,
        newDiscountValue: newItem.discountValue,
        newValidFrom: newItem.priceValidFrom,
        newValidUntil: newItem.priceValidUntil,
        newPolicyVersion: newItem.pricePolicyVersion,
      },
    });
  }
}
