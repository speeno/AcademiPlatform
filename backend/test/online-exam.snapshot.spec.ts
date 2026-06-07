import { BadRequestException } from '@nestjs/common';
import { ExamAttemptStatus } from '@prisma/client';
import { OnlineExamService } from '../src/online-exam/online-exam.service';

describe('OnlineExamService.uploadSnapshot', () => {
  it('응시 중이 아니면 스냅샷 업로드를 거부한다', async () => {
    const prisma = {
      examAttempt: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'attempt-1',
          userId: 'user-1',
          status: ExamAttemptStatus.GRADED,
        }),
      },
    } as any;

    const service = new OnlineExamService(prisma, {} as any);

    await expect(
      service.uploadSnapshot('attempt-1', 'user-1', {
        buffer: Buffer.from('fake'),
        mimetype: 'image/jpeg',
        size: 4,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
