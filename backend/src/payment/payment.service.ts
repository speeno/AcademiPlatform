import {
  Injectable,
  Optional,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { PaymentStatus, PaymentTarget } from '@prisma/client';
import { randomUUID } from 'crypto';
import { CoursesService } from '../courses/courses.service';
import {
  PricingSnapshotInput,
  PricingSnapshotResult,
} from '../common/pricing/pricing-snapshot';
import { PaymentPricingService } from './services/payment-pricing.service';
import { PortOneClient } from './services/portone.client';
import { PaymentPostProcessor } from './services/payment-post-processor.service';

/**
 * 결제 흐름의 오케스트레이터.
 *
 * 책임 분리(P2-service-split):
 * - 가격 스냅샷 해석 → {@link PaymentPricingService}
 * - 포트원 PG 통신     → {@link PortOneClient}
 * - 결제 후처리/환불 회수 → {@link PaymentPostProcessor}
 *
 * 본 클래스는 위 협력자 호출 + Prisma 트랜잭션 + 멱등/상태 검증/로깅/운영 알림만 담당한다.
 *
 * 테스트 호환:
 * - `payment.service.spec.ts`, `payment.refund.spec.ts`, `payment.pricing.spec.ts`,
 *   `payment-pricing.e2e-spec.ts` 가 `new PaymentService(prisma, config, coursesService)` 로
 *   직접 인스턴스화하므로, 추가 협력자 의존성은 `@Optional()` 로 받고 미주입 시 기본 인스턴스를
 *   생성하여 주입 호환성을 유지한다.
 * - 테스트가 `(service as any).verifyWithPortOne(...)`, `(service as any).calculatePricingSnapshot(...)` 로
 *   인스턴스 메서드 시그니처에 의존하므로, 본 클래스에 위임 wrapper 를 유지한다.
 */
@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly pricing: PaymentPricingService;
  private readonly portone: PortOneClient;
  private readonly postProcessor: PaymentPostProcessor;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private coursesService: CoursesService,
    @Optional() pricing?: PaymentPricingService,
    @Optional() portone?: PortOneClient,
    @Optional() postProcessor?: PaymentPostProcessor,
  ) {
    this.pricing = pricing ?? new PaymentPricingService(prisma);
    this.portone = portone ?? new PortOneClient(config);
    this.postProcessor =
      postProcessor ?? new PaymentPostProcessor(coursesService);
  }

  // 결제 주문 생성 (프론트 -> 포트원 SDK 호출 전)
  async createOrder(
    userId: string,
    targetType: PaymentTarget,
    targetId: string,
    clientAmount?: number,
  ) {
    const pricing = await this.pricing.resolveTargetPricing(
      userId,
      targetType,
      targetId,
    );
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

    this.logEvent('create_order', {
      userId,
      targetType,
      targetId,
      orderNo,
      amount: pricing.finalAmount,
    });

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
    if (payment.userId !== userId)
      throw new BadRequestException('결제 주문 정보가 일치하지 않습니다.');
    if (payment.paymentStatus === PaymentStatus.PAID) {
      return payment;
    }
    if (payment.paymentStatus !== PaymentStatus.PENDING) {
      throw new BadRequestException('처리 가능한 결제 상태가 아닙니다.');
    }

    const verified = await this.verifyWithPortOne(
      impUid,
      payment.finalAmount || payment.amount,
      orderNo,
    );
    if (!verified) {
      await this.prisma.payment.update({
        where: { orderNo },
        data: { paymentStatus: PaymentStatus.FAILED, pgTxId: impUid },
      });
      await this.notifyOps('payment_verify_failed', { orderNo, userId, impUid });
      throw new BadRequestException('결제 검증에 실패했습니다.');
    }

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        const current = await tx.payment.findUnique({ where: { orderNo } });
        if (!current) throw new NotFoundException('결제 주문을 찾을 수 없습니다.');
        if (current.paymentStatus === PaymentStatus.PAID) return current;
        if (current.paymentStatus !== PaymentStatus.PENDING) {
          throw new BadRequestException('처리 가능한 결제 상태가 아닙니다.');
        }

        const paid = await tx.payment.update({
          where: { orderNo },
          data: {
            paymentStatus: PaymentStatus.PAID,
            pgTxId: impUid,
            pgProvider: 'portone',
            paidAt: new Date(),
          },
        });

        await this.postProcessor.applyInTx(
          tx,
          current.targetType,
          current.targetId,
          userId,
          paid.id,
          paid.orderNo,
        );
        return paid;
      });

      this.logEvent('payment_verified', {
        orderNo,
        paymentId: updated.id,
        targetType: payment.targetType,
      });
      return updated;
    } catch (err) {
      this.logger.error(`결제 후처리 트랜잭션 실패 orderNo=${orderNo}`, err);
      await this.notifyOps('payment_postprocess_failed', { orderNo, userId, impUid });
      throw err;
    }
  }

  // 포트원 웹훅 처리
  async handleWebhook(body: { imp_uid: string; merchant_uid: string; status: string }) {
    const { imp_uid, merchant_uid, status } = body;
    const payment = await this.prisma.payment.findUnique({
      where: { orderNo: merchant_uid },
    });
    if (!payment) return;

    if (status === 'paid') {
      if (payment.paymentStatus === PaymentStatus.PAID) {
        this.logger.log(`웹훅 멱등 스킵(이미 PAID) orderNo=${merchant_uid}`);
        return;
      }
      if (payment.paymentStatus !== PaymentStatus.PENDING) return;

      const verified = await this.verifyWithPortOne(
        imp_uid,
        payment.finalAmount || payment.amount,
        merchant_uid,
      );
      if (!verified) {
        this.logger.warn(`웹훅 결제 검증 실패 - orderNo=${merchant_uid}`);
        await this.notifyOps('payment_webhook_verify_failed', {
          merchant_uid,
          imp_uid,
        });
        return;
      }

      try {
        await this.prisma.$transaction(async (tx) => {
          const current = await tx.payment.findUnique({
            where: { orderNo: merchant_uid },
          });
          if (!current || current.paymentStatus === PaymentStatus.PAID) return;
          if (current.paymentStatus !== PaymentStatus.PENDING) return;

          const paid = await tx.payment.update({
            where: { orderNo: merchant_uid },
            data: {
              paymentStatus: PaymentStatus.PAID,
              pgTxId: imp_uid,
              pgProvider: 'portone',
              paidAt: new Date(),
            },
          });

          await this.postProcessor.applyInTx(
            tx,
            current.targetType,
            current.targetId,
            current.userId,
            paid.id,
            merchant_uid,
          );
        });
      } catch (err) {
        this.logger.error(`웹훅 후처리 트랜잭션 실패 orderNo=${merchant_uid}`, err);
        await this.notifyOps('payment_webhook_postprocess_failed', {
          merchant_uid,
          imp_uid,
        });
        throw err;
      }
    } else if (status === 'cancelled' && payment.paymentStatus === PaymentStatus.PENDING) {
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
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment || payment.userId !== userId)
      throw new NotFoundException('결제 내역을 찾을 수 없습니다.');
    if (payment.paymentStatus !== PaymentStatus.PAID)
      throw new BadRequestException('환불 가능한 결제가 아닙니다.');

    // 1) PG 취소를 가장 먼저 수행. 실패 시 DB 상태는 PAID 유지 + 운영 알림으로 종료.
    await this.cancelWithPortOne(
      payment.pgTxId ?? '',
      payment.finalAmount || payment.amount,
      reason || '사용자 환불 요청',
    );

    // 2) PG 취소 성공 후 DB 상태·권한 회수를 단일 트랜잭션으로 묶어 원자성 보장.
    try {
      const refunded = await this.prisma.$transaction(async (tx) => {
        const current = await tx.payment.findUnique({ where: { id: paymentId } });
        if (!current) throw new NotFoundException('결제 내역을 찾을 수 없습니다.');
        if (current.paymentStatus === PaymentStatus.REFUNDED) {
          // 멱등: 이미 환불 처리됨.
          return current;
        }
        if (current.paymentStatus !== PaymentStatus.PAID) {
          throw new BadRequestException('환불 가능한 결제 상태가 아닙니다.');
        }
        const refundedPayment = await tx.payment.update({
          where: { id: paymentId },
          data: {
            paymentStatus: PaymentStatus.REFUNDED,
            refundedAt: new Date(),
            cancelledAt: new Date(),
          },
        });
        await this.postProcessor.rollbackInTx(
          tx,
          payment.targetType,
          payment.targetId,
          userId,
          paymentId,
        );
        return refundedPayment;
      });
      this.logEvent('payment_refunded', {
        paymentId,
        userId,
        targetType: payment.targetType,
        targetId: payment.targetId,
      });
      return refunded;
    } catch (err) {
      this.logger.error(
        `환불 후처리 트랜잭션 실패 paymentId=${paymentId}`,
        err,
      );
      // PG는 이미 취소된 상태이므로 운영자 수동 정합 필요.
      await this.notifyOps('payment_refund_postprocess_failed', {
        paymentId,
        userId,
        targetType: payment.targetType,
        targetId: payment.targetId,
      });
      throw err;
    }
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

  /* ---------- 테스트 호환 wrapper (기존 시그니처 유지) ---------- */

  /** 단위 테스트(`payment.pricing.spec.ts`, `payment-pricing.e2e-spec.ts`)가 인스턴스 메서드로 접근. */
  private calculatePricingSnapshot(
    input: PricingSnapshotInput,
  ): PricingSnapshotResult {
    return this.pricing.calculatePricingSnapshot(input);
  }

  /** 단위 테스트(`payment.service.spec.ts`)가 인스턴스 메서드로 접근. */
  private verifyWithPortOne(
    impUid: string,
    expectedAmount: number,
    expectedOrderNo?: string,
  ): Promise<boolean> {
    return this.portone.verify(impUid, expectedAmount, expectedOrderNo);
  }

  /** PaymentService.requestRefund 흐름의 PG 취소 단계. 테스트가 PG 호출/우회를 검증한다. */
  private cancelWithPortOne(
    impUid: string,
    amount: number,
    reason: string,
  ): Promise<void> {
    return this.portone.cancel(impUid, amount, reason);
  }

  /* ---------- 내부 운영 유틸 ---------- */

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
