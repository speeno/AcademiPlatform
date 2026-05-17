import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
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
import { calculatePricingSnapshot } from '../common/pricing/pricing-snapshot';
import { maskCourseForPublic } from '../common/pricing/public-price-policy';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async getAdminCourses(filter: { status?: CourseStatus; search?: string; page?: number; limit?: number }) {
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

    const where: any = { status: { in: [CourseStatus.ACTIVE, CourseStatus.UPCOMING] } };
    if (category) where.category = category;
    if (search) where.OR = [
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
    const course = await this.prisma.course.findFirst({
      where: { slug, status: CourseStatus.ACTIVE },
      include: {
        instructor: { select: { id: true, name: true } },
        modules: {
          orderBy: { sortOrder: 'asc' },
          include: {
            lessons: {
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true, title: true, lessonType: true, contentStatus: true,
                isPreview: true, sortOrder: true,
                videoAsset: { select: { durationSeconds: true, encodingStatus: true } },
              },
            },
          },
        },
        courseTextbooks: {
          include: {
            textbook: { select: { id: true, title: true, coverImageUrl: true, price: true } },
          },
        },
        _count: { select: { enrollments: true } },
      },
    });
    if (!course) throw new NotFoundException('교육과정을 찾을 수 없습니다.');
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
      create: { userId, courseId, paymentId, expiresAt, status: EnrollmentStatus.ACTIVE },
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
    const module = await this.prisma.courseModule.findUnique({ where: { id: moduleId } });
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
    const module = await this.prisma.courseModule.findUnique({ where: { id: moduleId } });
    if (!module) throw new NotFoundException('모듈을 찾을 수 없습니다.');

    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, moduleId },
    });
    if (!lesson) throw new NotFoundException('강의를 찾을 수 없습니다.');

    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.lessonType !== undefined ? { lessonType: data.lessonType } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
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
      throw new BadRequestException('유료 강의는 결제 완료 후 수강 신청이 가능합니다.');
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
      throw new BadRequestException('결제자와 수강 신청자가 일치하지 않습니다.');
    }
    if (payment.targetType !== PaymentTarget.ENROLLMENT) {
      throw new BadRequestException('수강 결제가 아닌 결제로는 등록할 수 없습니다.');
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
        where: { campaignId: campaign.id, status: BookVoucherCodeStatus.AVAILABLE },
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
}
