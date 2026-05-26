import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  AssignmentSubmissionStatus,
  BookVoucherCodeStatus,
  Course,
  CourseStatus,
  EnrollmentStatus,
  PaymentStatus,
  PaymentTarget,
  Prisma,
} from '@prisma/client';
import { CreateCourseDto, CourseFilterDto } from './dto/course.dto';
import { AddLessonDto } from './dto/lesson.dto';
import {
  AdminCreateAssignmentDto,
  AdminReviewAssignmentSubmissionDto,
  AdminUpdateAssignmentDto,
  SubmitAssignmentDto,
} from './dto/assignment.dto';
import { calculatePricingSnapshot } from '../common/pricing/pricing-snapshot';
import { maskCourseForPublic } from '../common/pricing/public-price-policy';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async getAdminCourses(filter: {
    status?: CourseStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, search, page = 1, limit = 50 } = filter;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          instructor: { select: { id: true, name: true, email: true } },
          _count: { select: { modules: true, enrollments: true } },
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    return { courses, total, page, limit };
  }

  async findAll(filter: CourseFilterDto, viewerId?: string) {
    const { category, search, page = 1, limit = 12 } = filter;
    const skip = (page - 1) * limit;

    const where: any = {
      status: { in: [CourseStatus.ACTIVE, CourseStatus.UPCOMING] },
    };
    if (category) where.category = category;
    if (search)
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        include: {
          instructor: { select: { id: true, name: true } },
          _count: { select: { enrollments: true, modules: true } },
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      courses: courses.map((c) => maskCourseForPublic(c, viewerId)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findBySlug(slug: string, viewerId?: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: {
        instructor: { select: { id: true, name: true } },
        modules: {
          orderBy: { sortOrder: 'asc' },
          include: {
            lessons: {
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                title: true,
                lessonType: true,
                contentStatus: true,
                isPreview: true,
                sortOrder: true,
                videoAsset: {
                  select: { durationSeconds: true, encodingStatus: true },
                },
              },
            },
          },
        },
        courseTextbooks: {
          include: {
            textbook: {
              select: {
                id: true,
                title: true,
                coverImageUrl: true,
                price: true,
              },
            },
          },
        },
        _count: { select: { enrollments: true } },
      },
    });
    if (!course || course.status !== CourseStatus.ACTIVE) {
      throw new NotFoundException('교육과정을 찾을 수 없습니다.');
    }
    return maskCourseForPublic(course, viewerId);
  }

  async findById(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { instructor: { select: { id: true, name: true } } },
    });
    if (!course) throw new NotFoundException('교육과정을 찾을 수 없습니다.');
    return course;
  }

  async create(dto: CreateCourseDto) {
    return this.prisma.course.create({ data: dto });
  }

  async update(id: string, dto: Partial<CreateCourseDto>) {
    await this.findById(id);
    return this.prisma.course.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.course.update({
      where: { id },
      data: { status: CourseStatus.ARCHIVED },
    });
  }

  async enroll(
    courseId: string,
    userId: string,
    paymentId?: string,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? this.prisma;
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: { instructor: { select: { id: true, name: true } } },
    });
    if (!course) throw new NotFoundException('교육과정을 찾을 수 없습니다.');
    const now = new Date();
    if (
      course.status !== CourseStatus.ACTIVE &&
      course.status !== CourseStatus.UPCOMING
    ) {
      throw new BadRequestException(
        '현재 수강 신청이 가능한 강의 상태가 아닙니다.',
      );
    }
    if (course.enrollmentStartAt && now < course.enrollmentStartAt) {
      throw new BadRequestException('수강 신청 시작 전입니다.');
    }
    if (course.enrollmentEndAt && now > course.enrollmentEndAt) {
      throw new BadRequestException('수강 신청이 마감되었습니다.');
    }
    if (course.maxCapacity && course.maxCapacity > 0) {
      const currentActive = await db.enrollment.count({
        where: { courseId, status: EnrollmentStatus.ACTIVE },
      });
      if (currentActive >= course.maxCapacity) {
        throw new BadRequestException('정원이 마감되었습니다.');
      }
    }

    // tx 가 전달된 경로(PaymentService.handlePostPaymentInTx)는 결제·금액 검증이 이미 완료된
    // 신뢰 호출이다. 외부 컨트롤러 진입(tx 미전달)은 paymentId 위조 차단을 위해 추가 검증을 수행한다.
    if (!tx) {
      await this.assertPaidEnrollmentPayment(course, userId, paymentId);
    }

    const existing = await db.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing && existing.status === EnrollmentStatus.ACTIVE) {
      throw new BadRequestException('이미 수강 중인 과정입니다.');
    }

    const expiresAt = course.learningPeriodDays
      ? new Date(Date.now() + course.learningPeriodDays * 86400000)
      : undefined;

    const enrollment = await db.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: {
        userId,
        courseId,
        paymentId,
        expiresAt,
        status: EnrollmentStatus.ACTIVE,
      },
      update: { status: EnrollmentStatus.ACTIVE, paymentId, expiresAt },
    });

    const courseTextbooks = await db.courseTextbook.findMany({
      where: { courseId, autoGrantOnEnroll: true },
    });
    if (courseTextbooks.length > 0) {
      await Promise.all(
        courseTextbooks.map((ct) =>
          db.textbookAccess.upsert({
            where: { userId_textbookId: { userId, textbookId: ct.textbookId } },
            create: {
              userId,
              textbookId: ct.textbookId,
              grantedBy: 'ENROLLMENT',
              sourceId: enrollment.id,
              expiresAt,
            },
            update: { revokedAt: null, expiresAt },
          }),
        ),
      );
    }

    await this.grantVoucherOnEnrollment(courseId, userId, enrollment.id, db);

    return enrollment;
  }

  async getMyEnrollments(userId: string) {
    return this.prisma.enrollment.findMany({
      where: { userId, status: EnrollmentStatus.ACTIVE },
      include: {
        course: {
          include: {
            instructor: { select: { name: true } },
            _count: { select: { modules: true } },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });
  }

  async addEnrollmentByAdmin(
    courseId: string,
    targetUserId: string,
    operatorId: string,
  ) {
    await this.prisma.user.findUniqueOrThrow({
      where: { id: operatorId },
      select: { id: true },
    });
    await this.prisma.user.findUniqueOrThrow({
      where: { id: targetUserId },
      select: { id: true },
    });
    return this.enroll(courseId, targetUserId, undefined, this.prisma);
  }

  async getAdminEnrollments(courseId: string) {
    await this.findById(courseId);
    return this.prisma.enrollment.findMany({
      where: { courseId },
      orderBy: { enrolledAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });
  }

  async getAdminAssignments(courseId: string) {
    await this.findById(courseId);
    return this.prisma.assignment.findMany({
      where: { courseId },
      orderBy: [{ dueAt: 'asc' }, { createdAt: 'asc' }],
      include: {
        _count: { select: { submissions: true } },
      },
    });
  }

  async createAssignment(courseId: string, dto: AdminCreateAssignmentDto) {
    await this.findById(courseId);
    return this.prisma.assignment.create({
      data: {
        courseId,
        title: dto.title.trim(),
        description: dto.description?.trim(),
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        allowResubmit: dto.allowResubmit ?? false,
        allowLateSubmit: dto.allowLateSubmit ?? false,
        maxFileSizeMb: dto.maxFileSizeMb ?? 50,
        allowedFileTypes: dto.allowedFileTypes ?? [],
      },
    });
  }

  async updateAssignment(
    courseId: string,
    assignmentId: string,
    dto: AdminUpdateAssignmentDto,
  ) {
    const assignment = await this.prisma.assignment.findFirst({
      where: { id: assignmentId, courseId },
    });
    if (!assignment) throw new NotFoundException('과제를 찾을 수 없습니다.');

    return this.prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description.trim() || null }
          : {}),
        ...(dto.dueAt !== undefined
          ? { dueAt: dto.dueAt ? new Date(dto.dueAt) : null }
          : {}),
        ...(dto.allowResubmit !== undefined
          ? { allowResubmit: dto.allowResubmit }
          : {}),
        ...(dto.allowLateSubmit !== undefined
          ? { allowLateSubmit: dto.allowLateSubmit }
          : {}),
        ...(dto.maxFileSizeMb !== undefined
          ? { maxFileSizeMb: dto.maxFileSizeMb }
          : {}),
        ...(dto.allowedFileTypes !== undefined
          ? { allowedFileTypes: dto.allowedFileTypes }
          : {}),
      },
    });
  }

  async deleteAssignment(courseId: string, assignmentId: string) {
    const assignment = await this.prisma.assignment.findFirst({
      where: { id: assignmentId, courseId },
      select: { id: true },
    });
    if (!assignment) throw new NotFoundException('과제를 찾을 수 없습니다.');
    await this.prisma.assignment.delete({ where: { id: assignmentId } });
    return { deleted: true };
  }

  async getAssignmentSubmissions(courseId: string, assignmentId: string) {
    const assignment = await this.prisma.assignment.findFirst({
      where: { id: assignmentId, courseId },
      select: { id: true },
    });
    if (!assignment) throw new NotFoundException('과제를 찾을 수 없습니다.');
    return this.prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      orderBy: { submittedAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async reviewAssignmentSubmission(
    courseId: string,
    assignmentId: string,
    submissionId: string,
    dto: AdminReviewAssignmentSubmissionDto,
  ) {
    const submission = await this.prisma.assignmentSubmission.findFirst({
      where: {
        id: submissionId,
        assignmentId,
        assignment: { courseId },
      },
      select: { id: true },
    });
    if (!submission) throw new NotFoundException('제출물을 찾을 수 없습니다.');

    return this.prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        status: dto.status,
        feedback: dto.feedback ?? null,
        feedbackAt: dto.feedback ? new Date() : null,
      },
    });
  }

  async getMyAssignments(courseId: string, userId: string) {
    await this.assertActiveEnrollment(courseId, userId);
    return this.prisma.assignment.findMany({
      where: { courseId },
      orderBy: [{ dueAt: 'asc' }, { createdAt: 'asc' }],
      include: {
        submissions: {
          where: { userId },
          take: 1,
          orderBy: { submittedAt: 'desc' },
          select: {
            id: true,
            status: true,
            submittedAt: true,
            feedback: true,
            feedbackAt: true,
            fileName: true,
          },
        },
      },
    });
  }

  async getMyAssignmentSubmission(assignmentId: string, userId: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { id: true, courseId: true },
    });
    if (!assignment) throw new NotFoundException('과제를 찾을 수 없습니다.');
    await this.assertActiveEnrollment(assignment.courseId, userId);
    return this.prisma.assignmentSubmission.findFirst({
      where: { assignmentId, userId },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async submitAssignment(
    assignmentId: string,
    userId: string,
    dto: SubmitAssignmentDto,
  ) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment) throw new NotFoundException('과제를 찾을 수 없습니다.');
    await this.assertActiveEnrollment(assignment.courseId, userId);

    const now = new Date();
    const current = await this.prisma.assignmentSubmission.findFirst({
      where: { assignmentId, userId },
      orderBy: { submittedAt: 'desc' },
    });
    if (
      assignment.dueAt &&
      now > assignment.dueAt &&
      !assignment.allowLateSubmit
    ) {
      throw new BadRequestException('제출 기한이 지났습니다.');
    }
    if (current && !assignment.allowResubmit) {
      throw new BadRequestException('재제출이 허용되지 않은 과제입니다.');
    }

    if (!dto.textAnswer?.trim() && !dto.fileUrl?.trim()) {
      throw new BadRequestException(
        '텍스트 답안 또는 파일 URL 중 하나는 필요합니다.',
      );
    }

    if (current && assignment.allowResubmit) {
      return this.prisma.assignmentSubmission.update({
        where: { id: current.id },
        data: {
          textAnswer: dto.textAnswer?.trim() || null,
          fileUrl: dto.fileUrl?.trim() || null,
          fileName: dto.fileName?.trim() || null,
          submittedAt: now,
          status: AssignmentSubmissionStatus.PENDING,
          feedback: null,
          feedbackAt: null,
        },
      });
    }

    return this.prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        userId,
        textAnswer: dto.textAnswer?.trim() || null,
        fileUrl: dto.fileUrl?.trim() || null,
        fileName: dto.fileName?.trim() || null,
        status: AssignmentSubmissionStatus.PENDING,
      },
    });
  }

  async getCategories() {
    const categories = await this.prisma.course.groupBy({
      by: ['category'],
      where: { status: CourseStatus.ACTIVE, category: { not: null } },
      _count: true,
    });
    return categories.map((c) => ({ name: c.category, count: c._count }));
  }

  async addModule(courseId: string, title: string) {
    await this.findById(courseId);
    const maxOrder = await this.prisma.courseModule.aggregate({
      where: { courseId },
      _max: { sortOrder: true },
    });
    return this.prisma.courseModule.create({
      data: { courseId, title, sortOrder: (maxOrder._max.sortOrder ?? -1) + 1 },
    });
  }

  async addLesson(moduleId: string, data: AddLessonDto) {
    const module = await this.prisma.courseModule.findUnique({
      where: { id: moduleId },
    });
    if (!module) throw new NotFoundException('모듈을 찾을 수 없습니다.');

    const maxOrder = await this.prisma.lesson.aggregate({
      where: { moduleId },
      _max: { sortOrder: true },
    });

    return this.prisma.lesson.create({
      data: {
        moduleId,
        courseId: module.courseId,
        title: data.title,
        lessonType: data.lessonType,
        description: data.description,
        sortOrder: data.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1,
        isPreview: data.isPreview ?? false,
      },
    });
  }

  async updateModule(
    courseId: string,
    moduleId: string,
    data: { title?: string; sortOrder?: number },
  ) {
    await this.findById(courseId);
    const module = await this.prisma.courseModule.findFirst({
      where: { id: moduleId, courseId },
    });
    if (!module) throw new NotFoundException('모듈을 찾을 수 없습니다.');

    return this.prisma.courseModule.update({
      where: { id: moduleId },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      },
    });
  }

  async updateLesson(
    moduleId: string,
    lessonId: string,
    data: {
      title?: string;
      lessonType?: AddLessonDto['lessonType'];
      description?: string;
      sortOrder?: number;
      isPreview?: boolean;
    },
  ) {
    const module = await this.prisma.courseModule.findUnique({
      where: { id: moduleId },
    });
    if (!module) throw new NotFoundException('모듈을 찾을 수 없습니다.');

    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, moduleId },
    });
    if (!lesson) throw new NotFoundException('강의를 찾을 수 없습니다.');

    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.lessonType !== undefined
          ? { lessonType: data.lessonType }
          : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
        ...(data.isPreview !== undefined ? { isPreview: data.isPreview } : {}),
      },
    });
  }

  /** 관리자 편집용: id로 강좌 조회 (모듈·레슨 포함) */
  async getCourseForAdmin(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        instructor: { select: { id: true, name: true } },
        modules: {
          orderBy: { sortOrder: 'asc' },
          include: {
            lessons: {
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                title: true,
                lessonType: true,
                description: true,
                sortOrder: true,
                isPreview: true,
              },
            },
          },
        },
      },
    });
    if (!course) throw new NotFoundException('교육과정을 찾을 수 없습니다.');
    return course;
  }

  async deleteModule(courseId: string, moduleId: string) {
    await this.findById(courseId);
    const module = await this.prisma.courseModule.findFirst({
      where: { id: moduleId, courseId },
    });
    if (!module) throw new NotFoundException('모듈을 찾을 수 없습니다.');
    await this.prisma.courseModule.delete({ where: { id: moduleId } });
    return { deleted: true };
  }

  async deleteLesson(moduleId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, moduleId },
    });
    if (!lesson) throw new NotFoundException('강의를 찾을 수 없습니다.');
    await this.prisma.lesson.delete({ where: { id: lessonId } });
    return { deleted: true };
  }

  /**
   * 외부 수강 등록 요청에서 결제 정보(paymentId)가 위조되지 않았는지 검증한다.
   * - 유료 판별은 `calculatePricingSnapshot.finalAmount > 0` 기준(legacy `price` 단독 사용 금지).
   * - 결제 레코드는 동일 사용자·ENROLLMENT 타입·동일 courseId·PAID 상태여야 한다.
   * - 결제 후처리 경로(PaymentService.handlePostPaymentInTx, tx 전달)는 이 검증을 건너뛴다.
   */
  private async assertPaidEnrollmentPayment(
    course: Course,
    userId: string,
    paymentId?: string,
  ): Promise<void> {
    const pricing = calculatePricingSnapshot({
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
      // 무료 강의는 paymentId 가 와도 무시(과거 호환).
      return;
    }

    if (!paymentId) {
      throw new BadRequestException(
        '유료 강의는 결제 완료 후 수강 신청이 가능합니다.',
      );
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        userId: true,
        targetType: true,
        targetId: true,
        paymentStatus: true,
        finalAmount: true,
        amount: true,
      },
    });

    if (!payment) {
      throw new BadRequestException('결제 정보를 찾을 수 없습니다.');
    }
    if (payment.userId !== userId) {
      throw new BadRequestException(
        '결제자와 수강 신청자가 일치하지 않습니다.',
      );
    }
    if (payment.targetType !== PaymentTarget.ENROLLMENT) {
      throw new BadRequestException(
        '수강 결제가 아닌 결제로는 등록할 수 없습니다.',
      );
    }
    if (payment.targetId !== course.id) {
      throw new BadRequestException('결제 대상 강의가 일치하지 않습니다.');
    }
    if (payment.paymentStatus !== PaymentStatus.PAID) {
      throw new BadRequestException('결제 완료 상태가 아닙니다.');
    }
    const paidAmount = payment.finalAmount || payment.amount;
    if (paidAmount <= 0) {
      throw new BadRequestException('결제 금액이 올바르지 않습니다.');
    }
  }

  private async grantVoucherOnEnrollment(
    courseId: string,
    userId: string,
    enrollmentId: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const campaigns = await db.bookVoucherCampaign.findMany({
      where: {
        isActive: true,
        OR: [{ courseId }, { courseId: null }],
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (campaigns.length === 0) return;

    for (const campaign of campaigns) {
      const existingGrant = await db.bookVoucherGrant.findUnique({
        where: { userId_campaignId: { userId, campaignId: campaign.id } },
      });
      if (existingGrant) continue;

      const code = await db.bookVoucherCode.findFirst({
        where: {
          campaignId: campaign.id,
          status: BookVoucherCodeStatus.AVAILABLE,
        },
        orderBy: { createdAt: 'asc' },
      });
      if (!code) continue;

      const locked = await db.bookVoucherCode.updateMany({
        where: { id: code.id, status: BookVoucherCodeStatus.AVAILABLE },
        data: { status: BookVoucherCodeStatus.ASSIGNED },
      });
      if (locked.count === 0) continue;

      await db.bookVoucherGrant.create({
        data: {
          campaignId: campaign.id,
          codeId: code.id,
          userId,
          courseId,
          enrollmentId,
        },
      });
    }
  }

  private async assertActiveEnrollment(
    courseId: string,
    userId: string,
  ): Promise<void> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { id: true, status: true },
    });
    if (!enrollment || enrollment.status !== EnrollmentStatus.ACTIVE) {
      throw new BadRequestException('수강 중인 사용자만 접근할 수 있습니다.');
    }
  }
}
