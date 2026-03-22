import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { EnrollmentStatus, QnaQuestionStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { NotifyService } from '../src/notify/notify.service';
import { QnaService } from '../src/qna/qna.service';

describe('QnaService (e2e style)', () => {
  const prisma = {
    user: { findUnique: jest.fn() },
    enrollment: { findUnique: jest.fn() },
    course: { findUnique: jest.fn() },
    qnaQuestion: { create: jest.fn(), findUnique: jest.fn() },
    $transaction: jest.fn(),
  };

  const notifyService = {
    send: jest.fn(),
  };

  let service: QnaService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        QnaService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotifyService, useValue: notifyService },
      ],
    }).compile();
    service = moduleRef.get(QnaService);
  });

  it('비수강 학생은 질문을 생성할 수 없다', async () => {
    prisma.enrollment.findUnique.mockResolvedValue(null);

    await expect(
      service.createQuestion('student-1', {
        courseId: 'course-1',
        assignedInstructorId: 'inst-1',
        title: '질문',
        content: '내용',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('배정되지 않은 강사는 답변할 수 없다', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: UserRole.INSTRUCTOR });
    prisma.qnaQuestion.findUnique.mockResolvedValue({
      id: 'q-1',
      title: '질문1',
      status: QnaQuestionStatus.OPEN,
      assignedInstructorId: 'inst-allowed',
      user: { id: 'student-1', name: '학생', email: 'student@test.com' },
      course: { id: 'course-1', title: '강좌1' },
      assignedInstructor: {
        id: 'inst-allowed',
        name: '허용강사',
        email: 'ok@test.com',
      },
    });

    await expect(
      service.answerQuestion('inst-other', 'q-1', { content: '답변' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('배정 강사가 답변하면 상태 전이 및 이메일 전송이 된다', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: UserRole.INSTRUCTOR });
    prisma.qnaQuestion.findUnique.mockResolvedValue({
      id: 'q-2',
      title: '강의 질문',
      status: QnaQuestionStatus.OPEN,
      assignedInstructorId: 'inst-1',
      user: { id: 'student-1', name: '학생A', email: 'student-a@test.com' },
      course: { id: 'course-1', title: 'AI 강좌' },
      assignedInstructor: {
        id: 'inst-1',
        name: '강사A',
        email: 'inst-a@test.com',
      },
    });

    prisma.$transaction.mockImplementation(
      (callback: (tx: unknown) => Promise<unknown>) => {
        return callback({
          qnaAnswer: {
            create: jest.fn().mockResolvedValue({
              id: 'ans-1',
              content: '답변 완료',
              user: { id: 'inst-1', name: '강사A', role: UserRole.INSTRUCTOR },
            }),
          },
          qnaQuestion: {
            update: jest.fn().mockResolvedValue({
              id: 'q-2',
              status: QnaQuestionStatus.ANSWERED,
              answeredAt: new Date('2026-03-22T07:30:00.000Z'),
            }),
          },
        });
      },
    );

    const result = await service.answerQuestion('inst-1', 'q-2', {
      content: '답변 완료',
    });

    expect(result.question.status).toBe(QnaQuestionStatus.ANSWERED);
    expect(notifyService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'email',
        to: 'student-a@test.com',
      }),
    );
  });

  it('수강 학생에게는 배정 가능한 강사 목록이 반환된다', async () => {
    prisma.enrollment.findUnique.mockResolvedValue({
      status: EnrollmentStatus.ACTIVE,
    });
    prisma.course.findUnique.mockResolvedValue({
      id: 'course-1',
      title: '강좌',
      instructor: {
        id: 'inst-main',
        name: '메인강사',
        email: 'main@test.com',
        role: UserRole.INSTRUCTOR,
      },
      cmsOwner: {
        id: 'inst-owner',
        name: '담당강사',
        email: 'owner@test.com',
        role: UserRole.INSTRUCTOR,
      },
      cmsCollaborators: [
        {
          user: {
            id: 'inst-col',
            name: '협업강사',
            email: 'col@test.com',
            role: UserRole.INSTRUCTOR,
          },
        },
      ],
    });

    const result = await service.getCourseAssignableInstructors(
      'course-1',
      'student-1',
    );
    expect(result.instructors).toHaveLength(3);
  });
});
