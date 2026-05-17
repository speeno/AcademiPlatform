import { Injectable, Logger } from '@nestjs/common';
import {
  EnrollmentStatus,
  ExamApplicationStatus,
  PaymentStatus,
  PaymentTarget,
  Prisma,
  TextbookGrantedBy,
} from '@prisma/client';
import { CoursesService } from '../../courses/courses.service';

/**
 * 결제 완료/환불 시 도메인 후처리(권한 부여·회수)를 담당.
 * - 모든 작업은 호출자가 보유한 `Prisma.TransactionClient` 안에서 수행되어 원자성을 보장한다.
 * - PaymentService 는 검증/오케스트레이션만 책임지고, 후처리 SRP 는 본 클래스가 가진다.
 */
@Injectable()
export class PaymentPostProcessor {
  private readonly logger = new Logger(PaymentPostProcessor.name);

  constructor(private coursesService: CoursesService) {}

  async applyInTx(
    tx: Prisma.TransactionClient,
    targetType: PaymentTarget,
    targetId: string,
    userId: string,
    paymentId: string,
    orderNo: string,
  ): Promise<void> {
    switch (targetType) {
      case PaymentTarget.ENROLLMENT: {
        await this.coursesService.enroll(targetId, userId, paymentId, tx);
        break;
      }
      case PaymentTarget.EXAM_APPLICATION: {
        await tx.examApplication.updateMany({
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
        await tx.textbookAccess.upsert({
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
    this.logger.log(
      `결제 후처리 완료 - orderNo=${orderNo}, target=${targetType}:${targetId}`,
    );
  }

  async rollbackInTx(
    tx: Prisma.TransactionClient,
    targetType: PaymentTarget,
    targetId: string,
    userId: string,
    paymentId: string,
  ): Promise<void> {
    switch (targetType) {
      case PaymentTarget.ENROLLMENT: {
        const enrollment = await tx.enrollment.findFirst({
          where: { userId, courseId: targetId, paymentId },
        });
        if (enrollment) {
          await tx.enrollment.update({
            where: { id: enrollment.id },
            data: { status: EnrollmentStatus.REFUNDED },
          });
          await tx.textbookAccess.updateMany({
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
        await tx.examApplication.updateMany({
          where: { id: targetId, userId, paymentId },
          data: {
            status: ExamApplicationStatus.REFUNDED,
            paymentStatus: PaymentStatus.REFUNDED,
          },
        });
        break;
      }
      case PaymentTarget.TEXTBOOK: {
        await tx.textbookAccess.updateMany({
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
}
