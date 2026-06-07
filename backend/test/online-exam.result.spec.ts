import {
  ExamAnswerStatus,
  ExamAttemptStatus,
  ExamResultStatus,
  QuestionType,
} from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';
import { OnlineExamService } from '../src/online-exam/online-exam.service';

const baseAttempt = {
  id: 'attempt-1',
  userId: 'user-1',
  status: ExamAttemptStatus.GRADED,
  submittedAt: new Date('2026-06-07T12:00:00Z'),
  questionOrder: ['q1'],
  examSession: {
    id: 'session-1',
    qualificationName: 'AI 자격',
    roundName: '1회',
    passingScore: 60,
  },
  user: { id: 'user-1', name: '홍길동', email: 'hong@example.com' },
  result: {
    id: 'result-1',
    totalScore: 5,
    maxScore: 5,
    percentage: 100,
    status: ExamResultStatus.PASSED,
    publishedAt: new Date('2026-06-07T13:00:00Z'),
    emailSentAt: null,
  },
  answers: [
    {
      id: 'answer-1',
      questionId: 'q1',
      selectedOptionIds: ['o1'],
      textAnswer: null,
      fileUrl: null,
      fileName: null,
      feedback: null,
      pointsSnapshot: 5,
      score: 5,
      questionSnapshot: { prompt: '문항 1', type: QuestionType.SINGLE_CHOICE },
      optionsSnapshot: [{ id: 'o1', label: '1', text: '정답' }],
      question: {
        type: QuestionType.SINGLE_CHOICE,
        prompt: '문항 1',
        explanation: '해설입니다.',
        options: [{ id: 'o1', label: '1', text: '정답', order: 0 }],
        answerKeys: [{ optionId: 'o1', textPattern: null }],
      },
    },
  ],
};

describe('OnlineExamService results', () => {
  it('객관식-only 제출 시 finalizeAttempt를 호출한다', async () => {
    const updates: any[] = [];
    const prisma = {
      examAttempt: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({
            id: 'attempt-1',
            userId: 'user-1',
            status: ExamAttemptStatus.IN_PROGRESS,
            answers: [
              {
                id: 'answer-1',
                questionId: 'q1',
                selectedOptionIds: ['o1'],
                pointsSnapshot: 5,
                question: {
                  type: QuestionType.SINGLE_CHOICE,
                  points: 5,
                  answerKeys: [{ optionId: 'o1' }],
                },
              },
            ],
          })
          .mockResolvedValueOnce({
            id: 'attempt-1',
            examSession: { passingScore: 60 },
            answers: [{ pointsSnapshot: 5, score: 5 }],
          })
          .mockResolvedValueOnce({ id: 'attempt-1', result: { totalScore: 5 } }),
        update: jest.fn().mockResolvedValue({ id: 'attempt-1' }),
      },
      examAnswer: {
        update: jest.fn().mockImplementation(async (args: any) => {
          updates.push(args);
          return args;
        }),
      },
      examResult: {
        upsert: jest.fn().mockResolvedValue({ id: 'result-1' }),
      },
    } as any;

    const service = new OnlineExamService(prisma, {} as any);
    await service.submitAttempt('attempt-1', 'user-1');

    expect(prisma.examAttempt.update).toHaveBeenCalledTimes(2);
    expect(prisma.examResult.upsert).toHaveBeenCalled();
  });

  it('getMyResult는 미공개 결과를 거부한다', async () => {
    const prisma = {
      examAttempt: {
        findUnique: jest.fn().mockResolvedValue({
          ...baseAttempt,
          result: { ...baseAttempt.result, publishedAt: null },
        }),
      },
    } as any;
    const service = new OnlineExamService(prisma, {} as any);

    await expect(service.getMyResult('attempt-1', 'user-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('getMyResult는 공개된 결과에 문항·해설을 포함한다', async () => {
    const prisma = {
      examAttempt: {
        findUnique: jest.fn().mockResolvedValue(baseAttempt),
      },
    } as any;
    const service = new OnlineExamService(prisma, {} as any);

    const result = await service.getMyResult('attempt-1', 'user-1');

    expect(result.result?.totalScore).toBe(5);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].explanation).toBe('해설입니다.');
    expect(result.items[0].isCorrect).toBe(true);
    expect(result.items[0].correctAnswer?.optionIds).toEqual(['o1']);
  });

  it('getAdminAttemptResult는 미공개 상태에서도 상세를 반환한다', async () => {
    const prisma = {
      examAttempt: {
        findUnique: jest.fn().mockResolvedValue({
          ...baseAttempt,
          result: { ...baseAttempt.result, publishedAt: null },
        }),
      },
    } as any;
    const service = new OnlineExamService(prisma, {} as any);

    const result = await service.getAdminAttemptResult('attempt-1');

    expect(result.user?.email).toBe('hong@example.com');
    expect(result.items[0].correctAnswer?.optionIds).toEqual(['o1']);
    expect(result.result?.publishedAt).toBeNull();
  });

  it('listSessionResults는 제출된 응시 기록을 반환한다', async () => {
    const prisma = {
      examAttempt: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'attempt-1',
            status: ExamAttemptStatus.GRADED,
            submittedAt: new Date('2026-06-07T12:00:00Z'),
            user: baseAttempt.user,
            result: baseAttempt.result,
          },
        ]),
      },
    } as any;
    const service = new OnlineExamService(prisma, {} as any);

    const rows = await service.listSessionResults('session-1');

    expect(rows).toHaveLength(1);
    expect(rows[0].attemptId).toBe('attempt-1');
    expect(rows[0].result?.totalScore).toBe(5);
  });
});
