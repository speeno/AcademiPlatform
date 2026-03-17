import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CourseStatus, EnrollmentStatus } from '@prisma/client';
import { CreateCourseDto, CourseFilterDto } from './dto/course.dto';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter: CourseFilterDto) {
    const { category, search, page = 1, limit = 12 } = filter;
    const skip = (page - 1) * limit;

    const where: any = { status: CourseStatus.ACTIVE };
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

  async addLesson(moduleId: string, data: any) {
    return this.prisma.lesson.create({ data: { ...data, moduleId } });
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
                sortOrder: true,
                isFree: true,
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
}
