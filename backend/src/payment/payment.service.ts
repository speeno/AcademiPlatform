import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  DiscountType,
  EnrollmentStatus,
  ExamApplicationStatus,
  PaymentStatus,
  PaymentTarget,
  TextbookGrantedBy,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { CoursesService } from '../courses/courses.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private coursesService: CoursesService,
  ) {}

  // 결제 주문 생성 (프론트 -> 포트원 SDK 호출 전)
  async createOrder(
    userId: string,
    targetType: PaymentTarget,
    targetId: string,
    clientAmount?: number,
  ) {
    const pricing = await this.resolveTargetPricing(userId, targetType, targetId);
    if (typeof clientAmount === 'number' && clientAmount !== pricing.finalAmount) {
      throw new BadRequestException('결제 금액이 올바르지 않습니다.');
    }

    const orderNo = `AQ-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`;

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        targetType,
        targetId,
        orderNo,
        amount: pricing.finalAmount,
        currency: pricing.currency,
        baseAmount: pricing.baseAmount,
        discountAmount: pricing.discountAmount,
        finalAmount: pricing.finalAmount,
        pricePolicyVersion: pricing.pricePolicyVersion,
        paymentStatus: PaymentStatus.PENDING,
      },
    });

    this.logEvent('create_order', { userId, targetType, targetId, orderNo, amount: pricing.finalAmount });

    return {
      orderNo,
      paymentId: payment.id,
      impCode: this.config.get('PORTONE_IMP_CODE', ''),
      amount: pricing.finalAmount,
      currency: pricing.currency,
      name: pricing.targetName,
    };
  }

  // 포트원 결제 완료 검증 및 처리
  async verifyAndComplete(userId: string, impUid: string, orderNo: string) {
    const payment = await this.prisma.payment.findUnique({ where: { orderNo } });
    if (!payment) throw new NotFoundException('결제 주문을 찾을 수 없습니다.');
    if (payment.userId !== userId) throw new BadRequestException('결제 주문 정보가 일치하지 않습니다.');
    if (payment.paymentStatus === PaymentStatus.PAID) throw new BadRequestException('이미 완료된 결제입니다.');
    if (payment.paymentStatus !== PaymentStatus.PENDING) throw new BadRequestException('처리 가능한 결제 상태가 아닙니다.');

    // 포트원 API 검증 (실제 운영 시 활성화)
    const verified = await this.verifyWithPortOne(impUid, payment.finalAmount || payment.amount);
    if (!verified) {
      await this.prisma.payment.update({
        where: { orderNo },
        data: { paymentStatus: PaymentStatus.FAILED, pgTxId: impUid },
      });
      await this.notifyOps('payment_verify_failed', { orderNo, userId, impUid });
      throw new BadRequestException('결제 검증에 실패했습니다.');
    }

    const updated = await this.prisma.payment.update({
      where: { orderNo },
      data: {
        paymentStatus: PaymentStatus.PAID,
        pgTxId: impUid,
        pgProvider: 'portone',
        paidAt: new Date(),
      },
    });

    // 결제 대상별 후처리
    await this.handlePostPayment(payment.targetType, payment.targetId, userId, updated.id, updated.orderNo);
    this.logEvent('payment_verified', { orderNo, paymentId: updated.id, targetType: payment.targetType });

    return updated;
  }

  // 포트원 웹훅 처리
  async handleWebhook(body: { imp_uid: string; merchant_uid: string; status: string }) {
    const { imp_uid, merchant_uid, status } = body;
    const payment = await this.prisma.payment.findUnique({ where: { orderNo: merchant_uid } });
    if (!payment) return;

    if (status === 'paid' && payment.paymentStatus === PaymentStatus.PENDING) {
      const verified = await this.verifyWithPortOne(imp_uid, payment.finalAmount || payment.amount, merchant_uid);
      if (!verified) {
        this.logger.warn(`웹훅 결제 검증 실패 - orderNo=${merchant_uid}`);
        await this.notifyOps('payment_webhook_verify_failed', { merchant_uid, imp_uid });
        return;
      }
      await this.prisma.payment.update({
        where: { orderNo: merchant_uid },
        data: { paymentStatus: PaymentStatus.PAID, pgTxId: imp_uid, paidAt: new Date() },
      });
      await this.handlePostPayment(payment.targetType, payment.targetId, payment.userId, payment.id, merchant_uid);
    } else if (status === 'cancelled') {
      await this.prisma.payment.update({
        where: { orderNo: merchant_uid },
        data: { paymentStatus: PaymentStatus.CANCELLED, cancelledAt: new Date() },
      });
    }
  }

  async getMyPayments(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async requestRefund(paymentId: string, userId: string, reason: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.userId !== userId) throw new NotFoundException('결제 내역을 찾을 수 없습니다.');
    if (payment.paymentStatus !== PaymentStatus.PAID) throw new BadRequestException('환불 가능한 결제가 아닙니다.');

    await this.cancelWithPortOne(payment.pgTxId ?? '', payment.finalAmount || payment.amount, reason || '사용자 환불 요청');
    const refunded = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { paymentStatus: PaymentStatus.REFUNDED, refundedAt: new Date(), cancelledAt: new Date() },
    });
    await this.rollbackPostPayment(payment.targetType, payment.targetId, userId, paymentId);
    this.logEvent('payment_refunded', { paymentId, userId, targetType: payment.targetType, targetId: payment.targetId });
    return refunded;
  }

  /* 관리자 */
  async getPayments(filter: { status?: PaymentStatus; page?: number; limit?: number }) {
    const { status, page = 1, limit = 20 } = filter;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.paymentStatus = status;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.payment.count({ where }),
    ]);
    return { payments, total, page, limit };
  }

  private async handlePostPayment(
    targetType: PaymentTarget,
    targetId: string,
    userId: string,
    paymentId: string,
    orderNo: string,
  ) {
    switch (targetType) {
      case PaymentTarget.ENROLLMENT: {
        await this.coursesService.enroll(targetId, userId, paymentId);
        break;
      }
      case PaymentTarget.EXAM_APPLICATION: {
        await this.prisma.examApplication.updateMany({
          where: { id: targetId, userId },
          data: {
            status: ExamApplicationStatus.APPLIED,
            paymentId,
            paymentStatus: PaymentStatus.PAID,
          },
        });
        break;
      }
      case PaymentTarget.TEXTBOOK: {
        await this.prisma.textbookAccess.upsert({
          where: { userId_textbookId: { userId, textbookId: targetId } },
          create: {
            userId,
            textbookId: targetId,
            grantedBy: TextbookGrantedBy.PURCHASE,
            sourceId: paymentId,
          },
          update: { revokedAt: null, sourceId: paymentId },
        });
        break;
      }
    }
    this.logger.log(`결제 후처리 완료 - orderNo=${orderNo}, target=${targetType}:${targetId}`);
  }

  private async verifyWithPortOne(impUid: string, expectedAmount: number, expectedOrderNo?: string): Promise<boolean> {
    const apiKey = this.config.get('PORTONE_API_KEY', '');
    const apiSecret = this.config.get('PORTONE_API_SECRET', '');
    if (!apiKey || !apiSecret) {
      this.logger.warn('포트원 API 키가 설정되지 않았습니다. 개발 환경에서는 검증을 건너뜁니다.');
      return true;
    }
    const paymentInfo = await this.fetchPortOnePayment(impUid);
    if (!paymentInfo) return false;
    const amountMatches = Number(paymentInfo.amount) === expectedAmount;
    const orderMatches = expectedOrderNo ? paymentInfo.merchant_uid === expectedOrderNo : true;
    return paymentInfo.status === 'paid' && amountMatches && orderMatches;
  }

  private async fetchPortOnePayment(impUid: string): Promise<any | null> {
    const apiKey = this.config.get('PORTONE_API_KEY', '');
    const apiSecret = this.config.get('PORTONE_API_SECRET', '');
    if (!apiKey || !apiSecret) return null;

    try {
      // 포트원 토큰 발급
      const tokenRes = await fetch('https://api.iamport.kr/users/getToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imp_key: apiKey, imp_secret: apiSecret }),
      });
      const tokenData = await tokenRes.json();
      const accessToken = tokenData.response?.access_token;
      if (!accessToken) return false;

      // 결제 정보 조회
      const paymentRes = await fetch(`https://api.iamport.kr/payments/${impUid}`, {
        headers: { Authorization: accessToken },
      });
      const paymentData = await paymentRes.json();
      return paymentData.response ?? null;
    } catch (err) {
      this.logger.error('포트원 검증 오류', err);
      return null;
    }
  }

  private async cancelWithPortOne(impUid: string, amount: number, reason: string) {
    const apiKey = this.config.get('PORTONE_API_KEY', '');
    const apiSecret = this.config.get('PORTONE_API_SECRET', '');
    if (!apiKey || !apiSecret || !impUid) {
      this.logger.warn('포트원 환불 키/트랜잭션이 없어 환불 검증을 건너뜁니다.');
      return;
    }

    const tokenRes = await fetch('https://api.iamport.kr/users/getToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imp_key: apiKey, imp_secret: apiSecret }),
    });
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.response?.access_token;
    if (!accessToken) throw new BadRequestException('포트원 환불 토큰 발급에 실패했습니다.');

    const cancelRes = await fetch('https://api.iamport.kr/payments/cancel', {
      method: 'POST',
      headers: { Authorization: accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ imp_uid: impUid, amount, reason }),
    });
    const cancelData = await cancelRes.json();
    if (!cancelRes.ok || cancelData.code) {
      await this.notifyOps('payment_refund_failed', { impUid, amount, reason, message: cancelData.message });
      throw new BadRequestException(cancelData.message ?? '포트원 환불 처리에 실패했습니다.');
    }
  }

  private async rollbackPostPayment(
    targetType: PaymentTarget,
    targetId: string,
    userId: string,
    paymentId: string,
  ) {
    switch (targetType) {
      case PaymentTarget.ENROLLMENT: {
        const enrollment = await this.prisma.enrollment.findFirst({
          where: { userId, courseId: targetId, paymentId },
        });
        if (enrollment) {
          await this.prisma.enrollment.update({
            where: { id: enrollment.id },
            data: { status: EnrollmentStatus.REFUNDED },
          });
          await this.prisma.textbookAccess.updateMany({
            where: {
              userId,
              grantedBy: TextbookGrantedBy.ENROLLMENT,
              sourceId: enrollment.id,
              revokedAt: null,
            },
            data: { revokedAt: new Date() },
          });
        }
        break;
      }
      case PaymentTarget.EXAM_APPLICATION: {
        await this.prisma.examApplication.updateMany({
          where: { id: targetId, userId, paymentId },
          data: {
            status: ExamApplicationStatus.REFUNDED,
            paymentStatus: PaymentStatus.REFUNDED,
          },
        });
        break;
      }
      case PaymentTarget.TEXTBOOK: {
        await this.prisma.textbookAccess.updateMany({
          where: {
            userId,
            textbookId: targetId,
            grantedBy: TextbookGrantedBy.PURCHASE,
            sourceId: paymentId,
            revokedAt: null,
          },
          data: { revokedAt: new Date() },
        });
        break;
      }
    }
  }

  private async resolveTargetPricing(userId: string, targetType: PaymentTarget, targetId: string) {
    if (targetType === PaymentTarget.ENROLLMENT) {
      const course = await this.prisma.course.findUnique({ where: { id: targetId } });
      if (!course) throw new NotFoundException('강의를 찾을 수 없습니다.');
      const existing = await this.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: targetId } },
      });
      if (existing && existing.status === EnrollmentStatus.ACTIVE) {
        throw new BadRequestException('이미 수강 중인 강의입니다.');
      }
      const pricing = this.calculatePricingSnapshot({
        legacyPrice: course.price,
        basePrice: course.basePrice,
        salePrice: course.salePrice,
        discountType: course.discountType,
        discountValue: course.discountValue,
        validFrom: course.priceValidFrom,
        validUntil: course.priceValidUntil,
        currency: course.currency,
        policyVersion: course.pricePolicyVersion,
      });
      if (pricing.finalAmount === 0) {
        throw new BadRequestException('무료 강의는 결제가 필요하지 않습니다.');
      }
      return { ...pricing, targetName: course.title };
    }

    if (targetType === PaymentTarget.EXAM_APPLICATION) {
      const app = await this.prisma.examApplication.findUnique({
        where: { id: targetId },
        include: { examSession: true },
      });
      if (!app || app.userId !== userId) throw new NotFoundException('시험 접수 정보를 찾을 수 없습니다.');
      if (app.status !== ExamApplicationStatus.PAYMENT_PENDING) {
        throw new BadRequestException('결제를 진행할 수 없는 접수 상태입니다.');
      }
      const pricing = this.calculatePricingSnapshot({
        legacyPrice: app.examSession.fee,
        basePrice: app.examSession.basePrice,
        salePrice: app.examSession.salePrice,
        discountType: app.examSession.discountType,
        discountValue: app.examSession.discountValue,
        validFrom: app.examSession.priceValidFrom,
        validUntil: app.examSession.priceValidUntil,
        currency: app.examSession.currency,
        policyVersion: app.examSession.pricePolicyVersion,
      });
      if (pricing.finalAmount === 0) {
        throw new BadRequestException('무료 응시 회차는 결제가 필요하지 않습니다.');
      }
      return {
        ...pricing,
        targetName: `${app.examSession.qualificationName} ${app.examSession.roundName}`,
      };
    }

    const textbook = await this.prisma.textbook.findUnique({ where: { id: targetId } });
    if (!textbook) throw new NotFoundException('교재를 찾을 수 없습니다.');
    if (!textbook.isStandalone) throw new BadRequestException('단독 구매가 가능한 교재가 아닙니다.');

    const existing = await this.prisma.textbookAccess.findUnique({
      where: { userId_textbookId: { userId, textbookId: targetId } },
    });
    if (existing && !existing.revokedAt) throw new BadRequestException('이미 구매한 교재입니다.');

    const pricing = this.calculatePricingSnapshot({
      legacyPrice: textbook.price,
      basePrice: textbook.basePrice,
      salePrice: textbook.salePrice,
      discountType: textbook.discountType,
      discountValue: textbook.discountValue,
      validFrom: textbook.priceValidFrom,
      validUntil: textbook.priceValidUntil,
      currency: textbook.currency,
      policyVersion: textbook.pricePolicyVersion,
    });
    if (pricing.finalAmount === 0) {
      throw new BadRequestException('무료 교재는 결제가 필요하지 않습니다.');
    }
    return { ...pricing, targetName: textbook.title };
  }

  private calculatePricingSnapshot(input: {
    legacyPrice: number;
    basePrice: number;
    salePrice: number | null;
    discountType: DiscountType;
    discountValue: number;
    validFrom: Date | null;
    validUntil: Date | null;
    currency: string;
    policyVersion: number;
  }) {
    const now = Date.now();
    const isInValidWindow =
      (!input.validFrom || now >= input.validFrom.getTime()) &&
      (!input.validUntil || now <= input.validUntil.getTime());

    const baseAmount = input.basePrice > 0 ? input.basePrice : input.legacyPrice;
    const saleCandidate = input.salePrice ?? baseAmount;
    const preDiscount = isInValidWindow ? saleCandidate : baseAmount;

    let discountAmount = 0;
    if (isInValidWindow && input.discountType === DiscountType.PERCENT) {
      discountAmount = Math.floor((preDiscount * Math.max(0, input.discountValue)) / 100);
    } else if (isInValidWindow && input.discountType === DiscountType.FIXED) {
      discountAmount = Math.max(0, input.discountValue);
    }
    const finalAmount = Math.max(0, preDiscount - discountAmount);

    return {
      currency: input.currency || 'KRW',
      baseAmount,
      discountAmount,
      finalAmount,
      pricePolicyVersion: input.policyVersion ?? 1,
    };
  }

  private logEvent(event: string, payload: Record<string, unknown>) {
    this.logger.log(JSON.stringify({ event, at: new Date().toISOString(), ...payload }));
  }

  private async notifyOps(event: string, payload: Record<string, unknown>) {
    const webhook = this.config.get('PAYMENT_ALERT_WEBHOOK_URL', '');
    if (!webhook) return;
    try {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          service: 'payment',
          at: new Date().toISOString(),
          payload,
        }),
      });
    } catch (err) {
      this.logger.warn(`운영 알림 전송 실패: ${event}`);
      this.logger.warn(err instanceof Error ? err.message : String(err));
    }
  }
}
