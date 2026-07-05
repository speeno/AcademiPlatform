import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  AssignmentSubmissionStatus,
  BookVoucherCodeStatus,
  CourseStatus,
  EnrollmentStatus,
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
import { maskCourseForPublic } from '../common/pricing/public-price-policy';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async getAdminCourses(filter: {
    status?: CourseStatus;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, category, search, page = 1, limit = 50 } = filter;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;
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

  /**
   * 학생 수강신청 — 결제 없이 PENDING(승인 대기) 상태로 신청한다.
   * 관리자가 승인(approveEnrollment)하면 ACTIVE 로 전환되어 수강이 시작된다.
   */
  async enroll(courseId: string, userId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        status: true,
        enrollmentStartAt: true,
        enrollmentEndAt: true,
      },
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

    const existing = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing?.status === EnrollmentStatus.ACTIVE) {
      throw new BadRequestException('이미 수강 중인 과정입니다.');
    }
    if (existing?.status === EnrollmentStatus.PENDING) {
      throw new BadRequestException('이미 신청되어 승인 대기 중입니다.');
    }

    return this.prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId, status: EnrollmentStatus.PENDING },
      update: {
        status: EnrollmentStatus.PENDING,
        paymentId: null,
        expiresAt: null,
        enrolledAt: now,
      },
    });
  }

  /**
   * 수강 활성화 — 관리자 승인/수동등록/결제완료(tx) 경로에서 ACTIVE 로 전환하고
   * 교재·바우처를 지급한다. (결제 없는 승인제이므로 결제 검증은 수행하지 않음)
   */
  async activateEnrollment(
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

    const existing = await db.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { status: true },
    });

    if (course.maxCapacity && course.maxCapacity > 0) {
      const currentActive = await db.enrollment.count({
        where: { courseId, status: EnrollmentStatus.ACTIVE },
      });
      if (
        existing?.status !== EnrollmentStatus.ACTIVE &&
        currentActive >= course.maxCapacity
      ) {
        throw new BadRequestException('정원이 마감되었습니다.');
      }
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

  /** 관리자: 수강신청 승인(PENDING → ACTIVE). */
  async approveEnrollment(courseId: string, enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id: enrollmentId, courseId },
      select: { id: true, userId: true, status: true },
    });
    if (!enrollment) {
      throw new NotFoundException('수강 신청을 찾을 수 없습니다.');
    }
    // 이미 승인된 건은 멱등 처리.
    if (enrollment.status === EnrollmentStatus.ACTIVE) return enrollment;
    // PENDING 만 승인 가능. 취소/환불/만료된 등록을 승인 버튼으로 조용히 재활성화하지 않는다.
    // (재수강이 필요하면 사용자가 다시 신청 → enroll() 이 PENDING 으로 재설정한다.)
    if (enrollment.status !== EnrollmentStatus.PENDING) {
      throw new BadRequestException(
        '승인 대기(PENDING) 상태의 신청만 승인할 수 있습니다.',
      );
    }
    return this.activateEnrollment(courseId, enrollment.userId);
  }

  /** 관리자: 수강신청 거절(PENDING → CANCELLED). */
  async rejectEnrollment(courseId: string, enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id: enrollmentId, courseId },
      select: { id: true, status: true },
    });
    if (!enrollment) {
      throw new NotFoundException('수강 신청을 찾을 수 없습니다.');
    }
    // 이미 취소된 건은 멱등 처리.
    if (enrollment.status === EnrollmentStatus.CANCELLED) return enrollment;
    // PENDING 만 거절 가능. 이미 ACTIVE(수강 중)인 등록을 거절로 처리하면 지급된 교재·
    // 바우처를 회수하지 않고 접근만 조용히 끊긴다 → 환불/취소 절차를 사용해야 한다.
    if (enrollment.status !== EnrollmentStatus.PENDING) {
      throw new BadRequestException(
        '승인 대기(PENDING) 상태의 신청만 거절할 수 있습니다. 이미 수강 중인 등록은 환불/취소 절차를 사용하세요.',
      );
    }
    return this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { status: EnrollmentStatus.CANCELLED },
    });
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
    return this.activateEnrollment(
      courseId,
      targetUserId,
      undefined,
      this.prisma,
    );
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
