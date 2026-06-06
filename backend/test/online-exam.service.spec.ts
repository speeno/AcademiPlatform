import { ExamAnswerStatus, ExamAttemptStatus, QuestionType } from '@prisma/client';
import { OnlineExamService } from '../src/online-exam/online-exam.service';

describe('OnlineExamService.submitAttempt', () => {
  it('객관식 답안을 자동채점하고 서술형이 있으면 수동채점 상태로 전환한다', async () => {
    const updates: any[] = [];
    const prisma = {
      examAttempt: {
        findUnique: jest.fn().mockResolvedValue({
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
            {
              id: 'answer-2',
              questionId: 'q2',
              selectedOptionIds: [],
              textAnswer: '서술형 답안',
              pointsSnapshot: 10,
              question: {
                type: QuestionType.SHORT_TEXT,
                points: 10,
                answerKeys: [],
              },
            },
          ],
        }),
        update: jest.fn().mockResolvedValue({ id: 'attempt-1' }),
      },
      examAnswer: {
        update: jest.fn().mockImplementation(async (args: any) => {
          updates.push(args);
          return args;
        }),
      },
    } as any;

    const service = new OnlineExamService(prisma, {} as any);
    await service.submitAttempt('attempt-1', 'user-1');

    expect(updates[0].data.score).toBe(5);
    expect(updates[0].data.status).toBe(ExamAnswerStatus.AUTO_GRADED);
    expect(updates[1].data.score).toBeNull();
    expect(updates[1].data.status).toBe(ExamAnswerStatus.SUBMITTED);
    expect(prisma.examAttempt.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: ExamAttemptStatus.MANUAL_GRADING }),
      }),
    );
  });
});
