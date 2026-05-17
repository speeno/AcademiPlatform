import { BadRequestException } from '@nestjs/common';
import {
  DiscountType,
  EnrollmentStatus,
  PaymentStatus,
  PaymentTarget,
} from '@prisma/client';
import { CoursesService } from '../src/courses/courses.service';

/**
 * P0 회귀 방지: 외부 enroll API 가 paymentId 만으로 유료 강의 우회 등록을 허용하면 안 된다.
 * - 트랜잭션 경로(PaymentService.handlePostPaymentInTx)는 신뢰 호출이므로 검증을 건너뛴다.
 * - 외부(컨트롤러 진입) 경로는 PAID·동일 사용자·ENROLLMENT 타입·동일 courseId 모두 검증한다.
 */
describe('CoursesService.enroll payment validation (P0)', () => {
  const buildCourse = (overrides: Partial<any> = {}) => ({
    id: 'course-1',
    price: 0,
    basePrice: 100000,
    salePrice: null,
    discountType: DiscountType.NONE,
    discountValue: 0,
    priceValidFrom: null,
    priceValidUntil: null,
    currency: 'KRW',
    pricePolicyVersion: 1,
    learningPeriodDays: null,
    instructor: { id: 'inst-1', name: 'tester' },
    ...overrides,
  });

  const buildPrisma = (state: {
    course: any;
    payment?: any;
  }) => {
    const upserted: any[] = [];
    return {
      _upserted: upserted,
      course: {
        findUnique: jest.fn(async () => state.course),
      },
      enrollment: {
        findUnique: jest.fn(async () => null),
        upsert: jest.fn(async ({ create }: any) => {
          const row = { id: 'enrollment-1', ...create };
          upserted.push(row);
          return row;
        }),
      },
      courseTextbook: {
        findMany: jest.fn(async () => []),
      },
      payment: {
        findUnique: jest.fn(async () => state.payment ?? null),
      },
      bookVoucherCampaign: {
        findMany: jest.fn(async () => []),
      },
    } as any;
  };

  it('유료 강의에 paymentId 가 없으면 등록 거부', async () => {
    const prisma = buildPrisma({ course: buildCourse() });
    const service = new CoursesService(prisma);
    await expect(
      service.enroll('course-1', 'user-1', undefined),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.enrollment.upsert).not.toHaveBeenCalled();
  });

  it('paymentId 가 존재하지 않으면 등록 거부', async () => {
    const prisma = buildPrisma({ course: buildCourse() });
    const service = new CoursesService(prisma);
    await expect(
      service.enroll('course-1', 'user-1', 'fake-payment'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('다른 사용자의 결제로는 등록 거부', async () => {
    const prisma = buildPrisma({
      course: buildCourse(),
      payment: {
        id: 'pay-1',
        userId: 'other-user',
        targetType: PaymentTarget.ENROLLMENT,
        targetId: 'course-1',
        paymentStatus: PaymentStatus.PAID,
        finalAmount: 100000,
        amount: 100000,
      },
    });
    const service = new CoursesService(prisma);
    await expect(
      service.enroll('course-1', 'user-1', 'pay-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('다른 강의 결제로는 등록 거부 (cross-course bypass 차단)', async () => {
    const prisma = buildPrisma({
      course: buildCourse(),
      payment: {
        id: 'pay-1',
        userId: 'user-1',
        targetType: PaymentTarget.ENROLLMENT,
        targetId: 'other-course',
        paymentStatus: PaymentStatus.PAID,
        finalAmount: 100000,
        amount: 100000,
      },
    });
    const service = new CoursesService(prisma);
    await expect(
      service.enroll('course-1', 'user-1', 'pay-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('targetType 이 ENROLLMENT 가 아닌 결제로는 등록 거부 (target spoofing 차단)', async () => {
    const prisma = buildPrisma({
      course: buildCourse(),
      payment: {
        id: 'pay-1',
        userId: 'user-1',
        targetType: PaymentTarget.TEXTBOOK,
        targetId: 'course-1',
        paymentStatus: PaymentStatus.PAID,
        finalAmount: 100000,
        amount: 100000,
      },
    });
    const service = new CoursesService(prisma);
    await expect(
      service.enroll('course-1', 'user-1', 'pay-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('PAID 가 아닌 결제로는 등록 거부', async () => {
    const prisma = buildPrisma({
      course: buildCourse(),
      payment: {
        id: 'pay-1',
        userId: 'user-1',
        targetType: PaymentTarget.ENROLLMENT,
        targetId: 'course-1',
        paymentStatus: PaymentStatus.PENDING,
        finalAmount: 100000,
        amount: 100000,
      },
    });
    const service = new CoursesService(prisma);
    await expect(
      service.enroll('course-1', 'user-1', 'pay-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('PAID + 동일 사용자/ENROLLMENT/coursId 모두 일치하면 등록 성공', async () => {
    const prisma = buildPrisma({
      course: buildCourse(),
      payment: {
        id: 'pay-1',
        userId: 'user-1',
        targetType: PaymentTarget.ENROLLMENT,
        targetId: 'course-1',
        paymentStatus: PaymentStatus.PAID,
        finalAmount: 100000,
        amount: 100000,
      },
    });
    const service = new CoursesService(prisma);
    const enrollment = await service.enroll('course-1', 'user-1', 'pay-1');
    expect(enrollment).toBeDefined();
    expect(prisma._upserted[0]).toMatchObject({
      userId: 'user-1',
      courseId: 'course-1',
      paymentId: 'pay-1',
      status: EnrollmentStatus.ACTIVE,
    });
  });

  it('finalAmount === 0(무료) 강의는 paymentId 없어도 등록 허용', async () => {
    const prisma = buildPrisma({
      course: buildCourse({ price: 0, basePrice: 0, salePrice: 0 }),
    });
    const service = new CoursesService(prisma);
    const enrollment = await service.enroll('course-1', 'user-1', undefined);
    expect(enrollment).toBeDefined();
    expect(prisma.payment.findUnique).not.toHaveBeenCalled();
  });

  it('tx 가 주어진 신뢰 호출(payment.service)은 paymentId 검증을 건너뛴다', async () => {
    const txState = {
      course: buildCourse(),
      enrollmentUpserted: [] as any[],
    };
    const tx: any = {
      course: { findUnique: jest.fn(async () => txState.course) },
      enrollment: {
        findUnique: jest.fn(async () => null),
        upsert: jest.fn(async ({ create }: any) => {
          const row = { id: 'enrollment-1', ...create };
          txState.enrollmentUpserted.push(row);
          return row;
        }),
      },
      courseTextbook: { findMany: jest.fn(async () => []) },
      bookVoucherCampaign: { findMany: jest.fn(async () => []) },
    };
    const prisma = buildPrisma({ course: txState.course });
    const service = new CoursesService(prisma);
    const enrollment = await service.enroll(
      'course-1',
      'user-1',
      'trusted-payment',
      tx,
    );
    expect(enrollment).toBeDefined();
    expect(prisma.payment.findUnique).not.toHaveBeenCalled();
    expect(txState.enrollmentUpserted[0]).toMatchObject({
      paymentId: 'trusted-payment',
    });
  });
});
