import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CourseStatus, EnrollmentStatus } from '@prisma/client';
import { CoursesService } from '../src/courses/courses.service';

/**
 * 수강신청 = 무결제 승인제(PENDING → 관리자 승인 → ACTIVE).
 * - enroll: 결제 없이 PENDING 생성. paymentId 를 만들지 않으며 결제 조회도 하지 않는다.
 * - approveEnrollment: PENDING 만 ACTIVE 로 전환(교재·바우처 지급). 취소/환불된 건을 승인 버튼으로 재활성화하지 않는다.
 * - rejectEnrollment: PENDING 만 CANCELLED 로. 이미 ACTIVE 인 등록은 환불 절차로만 취소해야 한다.
 */
describe('CoursesService enrollment approval flow', () => {
  const buildCourse = (overrides: Partial<any> = {}) => ({
    id: 'course-1',
    status: CourseStatus.ACTIVE,
    enrollmentStartAt: null,
    enrollmentEndAt: null,
    maxCapacity: null,
    learningPeriodDays: null,
    instructor: { id: 'inst-1', name: 'tester' },
    ...overrides,
  });

  const buildPrisma = (
    opts: {
      course?: any;
      existingEnrollment?: any;
      findFirstEnrollment?: any;
    } = {},
  ) => {
    const upserted: any[] = [];
    const updated: any[] = [];
    return {
      _upserted: upserted,
      _updated: updated,
      course: {
        findUnique: jest.fn(async () => opts.course ?? buildCourse()),
      },
      enrollment: {
        findUnique: jest.fn(async () => opts.existingEnrollment ?? null),
        findFirst: jest.fn(async () => opts.findFirstEnrollment ?? null),
        count: jest.fn(async () => 0),
        upsert: jest.fn(async ({ create }: any) => {
          const row = { id: 'enrollment-1', ...create };
          upserted.push(row);
          return row;
        }),
        update: jest.fn(async ({ where, data }: any) => {
          const row = { id: where.id, ...data };
          updated.push(row);
          return row;
        }),
      },
      courseTextbook: { findMany: jest.fn(async () => []) },
      bookVoucherCampaign: { findMany: jest.fn(async () => []) },
    } as any;
  };

  it('enroll: 결제 없이 PENDING 으로 신청되며 paymentId 를 만들지 않는다', async () => {
    const prisma = buildPrisma();
    const service = new CoursesService(prisma);
    const enrollment = await service.enroll('course-1', 'user-1');
    expect(enrollment).toBeDefined();
    expect(prisma._upserted[0]).toMatchObject({
      userId: 'user-1',
      courseId: 'course-1',
      status: EnrollmentStatus.PENDING,
    });
    expect(prisma._upserted[0].paymentId).toBeUndefined();
  });

  it('enroll: 신청 가능 상태가 아닌 강의는 거부', async () => {
    const prisma = buildPrisma({
      course: buildCourse({ status: CourseStatus.CLOSED }),
    });
    const service = new CoursesService(prisma);
    await expect(service.enroll('course-1', 'user-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.enrollment.upsert).not.toHaveBeenCalled();
  });

  it('enroll: 이미 ACTIVE 인 과정은 거부', async () => {
    const prisma = buildPrisma({
      existingEnrollment: { status: EnrollmentStatus.ACTIVE },
    });
    const service = new CoursesService(prisma);
    await expect(service.enroll('course-1', 'user-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('enroll: 이미 PENDING 이면 중복 신청 거부', async () => {
    const prisma = buildPrisma({
      existingEnrollment: { status: EnrollmentStatus.PENDING },
    });
    const service = new CoursesService(prisma);
    await expect(service.enroll('course-1', 'user-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('approveEnrollment: PENDING → ACTIVE 로 전환하고 교재·바우처 지급 경로를 태운다', async () => {
    const prisma = buildPrisma({
      findFirstEnrollment: {
        id: 'enrollment-1',
        userId: 'user-1',
        status: EnrollmentStatus.PENDING,
      },
    });
    const service = new CoursesService(prisma);
    const result = await service.approveEnrollment('course-1', 'enrollment-1');
    expect(result).toBeDefined();
    expect(prisma._upserted[0]).toMatchObject({
      userId: 'user-1',
      courseId: 'course-1',
      status: EnrollmentStatus.ACTIVE,
    });
    expect(prisma.courseTextbook.findMany).toHaveBeenCalled();
  });

  it('approveEnrollment: 이미 ACTIVE 면 멱등(재활성화 안 함)', async () => {
    const prisma = buildPrisma({
      findFirstEnrollment: {
        id: 'enrollment-1',
        userId: 'user-1',
        status: EnrollmentStatus.ACTIVE,
      },
    });
    const service = new CoursesService(prisma);
    const result = await service.approveEnrollment('course-1', 'enrollment-1');
    expect(result).toMatchObject({ status: EnrollmentStatus.ACTIVE });
    expect(prisma.enrollment.upsert).not.toHaveBeenCalled();
  });

  it('approveEnrollment: 취소된 신청은 승인 버튼으로 재활성화하지 않는다', async () => {
    const prisma = buildPrisma({
      findFirstEnrollment: {
        id: 'enrollment-1',
        userId: 'user-1',
        status: EnrollmentStatus.CANCELLED,
      },
    });
    const service = new CoursesService(prisma);
    await expect(
      service.approveEnrollment('course-1', 'enrollment-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.enrollment.upsert).not.toHaveBeenCalled();
  });

  it('approveEnrollment: 존재하지 않는 신청은 404', async () => {
    const prisma = buildPrisma({ findFirstEnrollment: null });
    const service = new CoursesService(prisma);
    await expect(
      service.approveEnrollment('course-1', 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejectEnrollment: PENDING → CANCELLED', async () => {
    const prisma = buildPrisma({
      findFirstEnrollment: {
        id: 'enrollment-1',
        status: EnrollmentStatus.PENDING,
      },
    });
    const service = new CoursesService(prisma);
    const result = await service.rejectEnrollment('course-1', 'enrollment-1');
    expect(result).toBeDefined();
    expect(prisma._updated[0]).toMatchObject({
      id: 'enrollment-1',
      status: EnrollmentStatus.CANCELLED,
    });
  });

  it('rejectEnrollment: 이미 ACTIVE 인 등록은 거절 불가(환불 절차 필요)', async () => {
    const prisma = buildPrisma({
      findFirstEnrollment: {
        id: 'enrollment-1',
        status: EnrollmentStatus.ACTIVE,
      },
    });
    const service = new CoursesService(prisma);
    await expect(
      service.rejectEnrollment('course-1', 'enrollment-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.enrollment.update).not.toHaveBeenCalled();
  });
});
