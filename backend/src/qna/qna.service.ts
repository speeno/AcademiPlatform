import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnrollmentStatus, QnaQuestionStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotifyService } from '../notify/notify.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateAnswerDto } from './dto/create-answer.dto';

@Injectable()
export class QnaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifyService: NotifyService,
  ) {}

  private async getUserRole(userId: string): Promise<UserRole> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    return user.role;
  }

  private async ensureEnrolledCourse(courseId: string, userId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment || enrollment.status !== EnrollmentStatus.ACTIVE) {
      throw new ForbiddenException('수강 중인 강좌에만 질문할 수 있습니다.');
    }
  }

  async getCourseAssignableInstructors(courseId: string, userId: string) {
    await this.ensureEnrolledCourse(courseId, userId);

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        instructor: {
          select: { id: true, name: true, email: true, role: true },
        },
        cmsOwner: { select: { id: true, name: true, email: true, role: true } },
        cmsCollaborators: {
          select: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
      },
    });

    if (!course) throw new NotFoundException('강좌를 찾을 수 없습니다.');

    const allowedRoles = new Set<UserRole>([
      UserRole.INSTRUCTOR,
      UserRole.OPERATOR,
      UserRole.SUPER_ADMIN,
    ]);

    const users = [
      course.instructor,
      course.cmsOwner,
      ...course.cmsCollaborators.map((c) => c.user),
    ]
      .filter((u): u is NonNullable<typeof u> => Boolean(u))
      .filter((u) => allowedRoles.has(u.role));

    const unique = Array.from(
      new Map(users.map((u) => [u.id, u])).values(),
    ).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
    }));

    return {
      courseId: course.id,
      courseTitle: course.title,
      instructors: unique,
    };
  }

  async createQuestion(userId: string, dto: CreateQuestionDto) {
    await this.ensureEnrolledCourse(dto.courseId, userId);

    const assignable = await this.getCourseAssignableInstructors(
      dto.courseId,
      userId,
    );
    const assigned = assignable.instructors.find(
      (i) => i.id === dto.assignedInstructorId,
    );
    if (!assigned) {
      throw new BadRequestException('해당 강좌에 배정 가능한 강사가 아닙니다.');
    }

    return this.prisma.qnaQuestion.create({
      data: {
        courseId: dto.courseId,
        userId,
        assignedInstructorId: dto.assignedInstructorId,
        title: dto.title.trim(),
        content: dto.content.trim(),
        isPrivate: dto.isPrivate ?? false,
        isClosed: false,
        status: QnaQuestionStatus.OPEN,
      },
      include: {
        course: { select: { id: true, title: true } },
        assignedInstructor: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async getMyQuestions(userId: string, courseId?: string) {
    return this.prisma.qnaQuestion.findMany({
      where: {
        userId,
        ...(courseId ? { courseId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        course: { select: { id: true, title: true } },
        assignedInstructor: { select: { id: true, name: true, email: true } },
        answers: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
      },
    });
  }

  async getMyQuestionDetail(userId: string, questionId: string) {
    const question = await this.prisma.qnaQuestion.findFirst({
      where: { id: questionId, userId },
      include: {
        course: { select: { id: true, title: true } },
        assignedInstructor: { select: { id: true, name: true, email: true } },
        answers: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
      },
    });
    if (!question) throw new NotFoundException('질문을 찾을 수 없습니다.');
    return question;
  }

  async getInstructorQuestions(
    userId: string,
    status?: QnaQuestionStatus,
    courseId?: string,
  ) {
    const role = await this.getUserRole(userId);
    const isOperator =
      role === UserRole.OPERATOR || role === UserRole.SUPER_ADMIN;

    return this.prisma.qnaQuestion.findMany({
      where: {
        ...(isOperator ? {} : { assignedInstructorId: userId }),
        ...(status ? { status } : {}),
        ...(courseId ? { courseId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        course: { select: { id: true, title: true } },
        user: { select: { id: true, name: true, email: true } },
        assignedInstructor: { select: { id: true, name: true, email: true } },
        answers: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
      },
    });
  }

  async answerQuestion(
    userId: string,
    questionId: string,
    dto: CreateAnswerDto,
  ) {
    const role = await this.getUserRole(userId);
    const isOperator =
      role === UserRole.OPERATOR || role === UserRole.SUPER_ADMIN;

    const question = await this.prisma.qnaQuestion.findUnique({
      where: { id: questionId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
        assignedInstructor: { select: { id: true, name: true, email: true } },
      },
    });
    if (!question) throw new NotFoundException('질문을 찾을 수 없습니다.');

    if (!isOperator && question.assignedInstructorId !== userId) {
      throw new ForbiddenException('배정된 강사만 답변할 수 있습니다.');
    }

    if (question.status === QnaQuestionStatus.CLOSED) {
      throw new BadRequestException('닫힌 질문에는 답변할 수 없습니다.');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const answer = await tx.qnaAnswer.create({
        data: {
          questionId,
          userId,
          content: dto.content.trim(),
        },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      });

      const updatedQuestion = await tx.qnaQuestion.update({
        where: { id: questionId },
        data: {
          status: QnaQuestionStatus.ANSWERED,
          answeredAt: new Date(),
          isClosed: false,
        },
        select: {
          id: true,
          status: true,
          answeredAt: true,
        },
      });

      return { answer, question: updatedQuestion };
    });

    await this.notifyService.send({
      type: 'email',
      to: question.user.email,
      subject: `[AcademiQ] 질문에 답변이 등록되었습니다: ${question.course.title}`,
      body: `
        <p>${question.user.name}님, 안녕하세요.</p>
        <p><strong>${question.course.title}</strong> 강좌 질문에 답변이 등록되었습니다.</p>
        <p>질문 제목: ${question.title}</p>
        <p>답변자: ${isOperator ? '운영자' : question.assignedInstructor.name}</p>
        <p>내 강의실 > 내 질문에서 확인해 주세요.</p>
      `,
    });

    return result;
  }
}
