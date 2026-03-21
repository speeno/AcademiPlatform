import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EnrollmentStatus } from '@prisma/client';
import { CmsService } from '../cms/cms.service';

@Injectable()
export class LmsService {
  constructor(
    private prisma: PrismaService,
    private cmsService: CmsService,
  ) {}

  async getClassroom(userId: string) {
    return this.prisma.enrollment.findMany({
      where: { userId, status: EnrollmentStatus.ACTIVE },
      include: {
        course: {
          include: {
            instructor: { select: { name: true } },
            modules: {
              orderBy: { sortOrder: 'asc' },
              include: {
                lessons: {
                  orderBy: { sortOrder: 'asc' },
                  select: { id: true, title: true, lessonType: true, sortOrder: true },
                },
              },
            },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });
  }

  async getMyVouchers(userId: string) {
    return this.prisma.bookVoucherGrant.findMany({
      where: { userId },
      orderBy: { grantedAt: 'desc' },
      include: {
        campaign: { select: { id: true, name: true, provider: true } },
        code: { select: { code: true, status: true } },
        course: { select: { id: true, title: true } },
      },
    });
  }

  async getCourseWithProgress(courseId: string, userId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment || enrollment.status !== EnrollmentStatus.ACTIVE) {
      throw new ForbiddenException('수강 권한이 없습니다.');
    }

    const [course, progresses] = await Promise.all([
      this.prisma.course.findUnique({
        where: { id: courseId },
        include: {
          modules: {
            orderBy: { sortOrder: 'asc' },
            include: {
              lessons: {
                orderBy: { sortOrder: 'asc' },
                include: {
                  videoAsset: {
                    select: { durationSeconds: true, encodingStatus: true, sourceType: true, youtubeUrl: true },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.lessonProgress.findMany({
        where: { userId },
      }),
    ]);

    if (!course) throw new NotFoundException('교육과정을 찾을 수 없습니다.');

    const progressMap = new Map(progresses.map((p) => [p.lessonId, p]));

    return { course, progressMap: Object.fromEntries(progressMap), enrollment };
  }

  async updateProgress(
    lessonId: string,
    userId: string,
    data: { watchedSeconds?: number; isCompleted?: boolean; completionRate?: number },
  ) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('강의를 찾을 수 없습니다.');

    const progress = await this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId,
        lessonId,
        ...data,
        status: data.isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
        completedAt: data.isCompleted ? new Date() : undefined,
      },
      update: {
        ...data,
        status: data.isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
        completedAt: data.isCompleted ? new Date() : undefined,
      },
    });

    // 과정 전체 진도 업데이트
    if (lesson.moduleId) {
      await this.recalculateCourseProgress(userId, lessonId);
    }

    return progress;
  }

  async getLessonContent(lessonId: string, userId: string) {
    return this.cmsService.getPublishedLessonContent(lessonId, userId);
  }

  private async recalculateCourseProgress(userId: string, lessonId: string) {
    const lessonWithCourse = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { select: { courseId: true } } },
    });
    if (!lessonWithCourse?.module?.courseId) return;

    const courseId = lessonWithCourse.module.courseId;
    const [totalLessons, completedLessons] = await Promise.all([
      this.prisma.lesson.count({
        where: { module: { courseId }, contentStatus: 'PUBLISHED' },
      }),
      this.prisma.lessonProgress.count({
        where: {
          userId,
          isCompleted: true,
          lesson: { module: { courseId } },
        },
      }),
    ]);

    if (totalLessons > 0) {
      await this.prisma.enrollment.updateMany({
        where: { userId, courseId },
        data: { progressRate: (completedLessons / totalLessons) * 100 },
      });
    }
  }
}
