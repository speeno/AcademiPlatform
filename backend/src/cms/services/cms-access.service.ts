import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnrollmentStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * CMS 권한/접근 검사 책임만 가진다. (강좌 편집·검수·수강 권한)
 * - CmsContentService / CmsReviewService / CmsImportService 가 공통 사용한다.
 * - 운영자(OPERATOR/SUPER_ADMIN) > 담당강사(cmsOwner) > 수강자(ACTIVE) 순으로 권한이 강하다.
 */
@Injectable()
export class CmsAccessService {
  constructor(private prisma: PrismaService) {}

  async getUserRole(userId: string): Promise<UserRole> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    return user.role;
  }

  async assertOperator(userId: string): Promise<void> {
    const role = await this.getUserRole(userId);
    if (role !== UserRole.OPERATOR && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('운영자 권한이 필요합니다.');
    }
  }

  async canEditCourse(userId: string, courseId: string): Promise<boolean> {
    const role = await this.getUserRole(userId);
    if (role === UserRole.OPERATOR || role === UserRole.SUPER_ADMIN) return true;

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { cmsOwnerId: true },
    });
    if (!course) throw new NotFoundException('강좌를 찾을 수 없습니다.');
    if (role === UserRole.INSTRUCTOR) return course.cmsOwnerId === userId;
    return false;
  }

  async ensureCanEditCourse(userId: string, courseId: string): Promise<void> {
    const allowed = await this.canEditCourse(userId, courseId);
    if (!allowed)
      throw new ForbiddenException('해당 강좌의 CMS 편집 권한이 없습니다.');
  }

  async ensureCanEditLesson(
    userId: string,
    lessonId: string,
  ): Promise<{ courseId: string; lessonId: string }> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, courseId: true },
    });
    if (!lesson) throw new NotFoundException('레슨을 찾을 수 없습니다.');
    await this.ensureCanEditCourse(userId, lesson.courseId);
    return { courseId: lesson.courseId, lessonId: lesson.id };
  }

  async canReadPublishedCourse(
    userId: string,
    courseId: string,
    isPreview: boolean,
  ): Promise<boolean> {
    const role = await this.getUserRole(userId);
    if (role === UserRole.OPERATOR || role === UserRole.SUPER_ADMIN) return true;
    if (await this.canEditCourse(userId, courseId)) return true;
    if (isPreview) return true;

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { status: true },
    });
    return enrollment?.status === EnrollmentStatus.ACTIVE;
  }
}
