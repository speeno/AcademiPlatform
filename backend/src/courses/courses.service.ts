import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { BookVoucherCodeStatus, CourseStatus, EnrollmentStatus } from '@prisma/client';
import { CreateCourseDto, CourseFilterDto } from './dto/course.dto';
import { AddLessonDto } from './dto/lesson.dto';

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

  async findAll(filter: CourseFilterDto) {
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

    return { courses, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findBySlug(slug: string) {
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
    return course;
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

  async enroll(courseId: string, userId: string, paymentId?: string) {
    const course = await this.findById(courseId);
    if (course.price > 0 && !paymentId) {
      throw new BadRequestException('유료 강의는 결제 완료 후 수강 신청이 가능합니다.');
    }

    const existing = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing && existing.status === EnrollmentStatus.ACTIVE) {
      throw new BadRequestException('이미 수강 중인 과정입니다.');
    }

    const expiresAt = course.learningPeriodDays
      ? new Date(Date.now() + course.learningPeriodDays * 86400000)
      : undefined;

    const enrollment = await this.prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId, paymentId, expiresAt, status: EnrollmentStatus.ACTIVE },
      update: { status: EnrollmentStatus.ACTIVE, paymentId, expiresAt },
    });

    // 수강 등록 시 연결 교재 자동 권한 부여
    const courseTextbooks = await this.prisma.courseTextbook.findMany({
      where: { courseId, autoGrantOnEnroll: true },
    });
    if (courseTextbooks.length > 0) {
      await Promise.all(
        courseTextbooks.map((ct) =>
          this.prisma.textbookAccess.upsert({
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

    // 수강 등록 시 북이오 무료 이용권 자동 지급(캠페인 활성화 기준)
    await this.grantVoucherOnEnrollment(courseId, userId, enrollment.id);

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

  private async grantVoucherOnEnrollment(courseId: string, userId: string, enrollmentId: string) {
    const campaigns = await this.prisma.bookVoucherCampaign.findMany({
      where: {
        isActive: true,
        OR: [{ courseId }, { courseId: null }],
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (campaigns.length === 0) return;

    for (const campaign of campaigns) {
      const existingGrant = await this.prisma.bookVoucherGrant.findUnique({
        where: { userId_campaignId: { userId, campaignId: campaign.id } },
      });
      if (existingGrant) continue;

      const code = await this.prisma.bookVoucherCode.findFirst({
        where: { campaignId: campaign.id, status: BookVoucherCodeStatus.AVAILABLE },
        orderBy: { createdAt: 'asc' },
      });
      if (!code) continue;

      const locked = await this.prisma.bookVoucherCode.updateMany({
        where: { id: code.id, status: BookVoucherCodeStatus.AVAILABLE },
        data: { status: BookVoucherCodeStatus.ASSIGNED },
      });
      if (locked.count === 0) continue;

      await this.prisma.bookVoucherGrant.create({
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
