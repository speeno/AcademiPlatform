import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EnrollmentStatus,
  ExamApplicationStatus,
  PaymentTarget,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  PricingSnapshotInput,
  PricingSnapshotResult,
  calculatePricingSnapshot,
} from '../../common/pricing/pricing-snapshot';

export interface ResolvedTargetPricing extends PricingSnapshotResult {
  targetName: string;
}

/**
 * 결제 대상(강의/시험/교재) 별 가격 스냅샷 해석을 전담한다.
 * - PaymentService 의 결제 주문/검증 로직과 분리하여 SRP 를 준수한다.
 * - 무료(finalAmount === 0)·중복 결제·상태 검증 책임도 함께 가진다.
 */
@Injectable()
export class PaymentPricingService {
  constructor(private prisma: PrismaService) {}

  async resolveTargetPricing(
    userId: string,
    targetType: PaymentTarget,
    targetId: string,
  ): Promise<ResolvedTargetPricing> {
    if (targetType === PaymentTarget.ENROLLMENT) {
      return this.resolveEnrollmentPricing(userId, targetId);
    }
    if (targetType === PaymentTarget.EXAM_APPLICATION) {
      return this.resolveExamApplicationPricing(userId, targetId);
    }
    return this.resolveTextbookPricing(userId, targetId);
  }

  /**
   * 가격 정책 스냅샷 계산. 공통 유틸로 위임하여 CoursesService.enroll 결제 검증과 동일 로직을 공유한다.
   * 테스트(`payment.pricing.spec.ts`, `payment-pricing.e2e-spec.ts`)가 PaymentService 의
   * 인스턴스 메서드로 접근하므로, PaymentService 에서는 이 함수를 그대로 위임한다.
   */
  calculatePricingSnapshot(input: PricingSnapshotInput): PricingSnapshotResult {
    return calculatePricingSnapshot(input);
  }

  private async resolveEnrollmentPricing(
    userId: string,
    courseId: string,
  ): Promise<ResolvedTargetPricing> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) throw new NotFoundException('강의를 찾을 수 없습니다.');

    const existing = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
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

  private async resolveExamApplicationPricing(
    userId: string,
    applicationId: string,
  ): Promise<ResolvedTargetPricing> {
    const app = await this.prisma.examApplication.findUnique({
      where: { id: applicationId },
      include: { examSession: true },
    });
    if (!app || app.userId !== userId) {
      throw new NotFoundException('시험 접수 정보를 찾을 수 없습니다.');
    }
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

  private async resolveTextbookPricing(
    userId: string,
    textbookId: string,
  ): Promise<ResolvedTargetPricing> {
    const textbook = await this.prisma.textbook.findUnique({
      where: { id: textbookId },
    });
    if (!textbook) throw new NotFoundException('교재를 찾을 수 없습니다.');
    if (!textbook.isStandalone) {
      throw new BadRequestException('단독 구매가 가능한 교재가 아닙니다.');
    }

    const existing = await this.prisma.textbookAccess.findUnique({
      where: { userId_textbookId: { userId, textbookId } },
    });
    if (existing && !existing.revokedAt) {
      throw new BadRequestException('이미 구매한 교재입니다.');
    }

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
}
