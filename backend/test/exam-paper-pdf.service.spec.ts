import { BadRequestException } from '@nestjs/common';
import { ExamMode, ExamPaperStatus, QuestionType } from '@prisma/client';
import { ExamPaperPdfService } from '../src/online-exam/exam-paper-pdf.service';

const mockSession = {
  id: 'session-1',
  qualificationName: 'AI ISO Creator',
  roundName: '2026년 제1회',
  examAt: new Date('2026-06-07T10:00:00+09:00'),
  place: '서울 본원',
  durationMinutes: 90,
  passingScore: 60,
  examMode: ExamMode.OFFLINE,
};

const mockPaper = {
  id: 'paper-1',
  title: 'AI ISO Creator 2026년 제1회 시험지',
  description: JSON.stringify({ notes: '계산기 사용 불가' }),
  status: ExamPaperStatus.DRAFT,
  totalPoints: 15,
  items: [
    {
      order: 0,
      points: 5,
      question: {
        prompt: '다음 중 올바른 설명은?',
        type: QuestionType.SINGLE_CHOICE,
        explanation: null,
        options: [
          { id: 'opt-1', label: '①', text: '보기 1' },
          { id: 'opt-2', label: '②', text: '보기 2' },
        ],
        answerKeys: [{ optionId: 'opt-2', textPattern: null, explanation: '정답 해설입니다.' }],
      },
    },
    {
      order: 1,
      points: 10,
      question: {
        prompt: '서술형 문항입니다.',
        type: QuestionType.SHORT_TEXT,
        explanation: null,
        options: [],
        answerKeys: [{ optionId: null, textPattern: '핵심 키워드', explanation: null }],
      },
    },
  ],
};

function createService(examMode: ExamMode = ExamMode.OFFLINE, status: ExamPaperStatus = ExamPaperStatus.DRAFT) {
  const prisma = {
    examSession: {
      findUnique: jest.fn().mockResolvedValue({ ...mockSession, examMode }),
    },
    examPaper: {
      findFirst: jest.fn().mockResolvedValue({ ...mockPaper, status }),
    },
  } as any;

  return new ExamPaperPdfService(prisma);
}

describe('ExamPaperPdfService.exportPaperPdf', () => {
  it('DRAFT 수험자용 PDF를 생성한다', async () => {
    const service = createService();
    const { buffer, filename } = await service.exportPaperPdf('session-1', 'student');

    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
    expect(filename).toContain('시험지');
    expect(filename).toContain('초안');
    expect(buffer.length).toBeGreaterThan(2000);
  });

  it('PUBLISHED 수험자용 PDF 파일명에 초안 접미사가 없다', async () => {
    const service = createService(ExamMode.OFFLINE, ExamPaperStatus.PUBLISHED);
    const { filename } = await service.exportPaperPdf('session-1', 'student');

    expect(filename).toContain('시험지.pdf');
    expect(filename).not.toContain('초안');
  });

  it('정답지 PDF는 수험자용과 다른 내용으로 생성된다', async () => {
    const service = createService();
    const student = await service.exportPaperPdf('session-1', 'student');
    const answer = await service.exportPaperPdf('session-1', 'answer');

    expect(answer.buffer.subarray(0, 4).toString()).toBe('%PDF');
    expect(answer.filename).toContain('정답지');
    expect(answer.buffer.equals(student.buffer)).toBe(false);
    expect(answer.buffer.length).toBeGreaterThan(2000);
  });

  it('통합본 PDF는 수험자용보다 크게 생성된다', async () => {
    const service = createService();
    const student = await service.exportPaperPdf('session-1', 'student');
    const combined = await service.exportPaperPdf('session-1', 'combined');

    expect(combined.buffer.subarray(0, 4).toString()).toBe('%PDF');
    expect(combined.filename).toContain('통합본');
    expect(combined.buffer.length).toBeGreaterThan(student.buffer.length);
    expect(combined.buffer.equals(student.buffer)).toBe(false);
  });

  it('PUBLISHED 통합본 파일명에 초안 접미사가 없다', async () => {
    const service = createService(ExamMode.OFFLINE, ExamPaperStatus.PUBLISHED);
    const { filename } = await service.exportPaperPdf('session-1', 'combined');

    expect(filename).toContain('통합본.pdf');
    expect(filename).not.toContain('초안');
  });

  it('온라인 전용 회차는 PDF 출력을 거부한다', async () => {
    const service = createService(ExamMode.ONLINE);

    await expect(service.exportPaperPdf('session-1', 'student')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('문항이 없으면 PDF 출력을 거부한다', async () => {
    const prisma = {
      examSession: {
        findUnique: jest.fn().mockResolvedValue(mockSession),
      },
      examPaper: {
        findFirst: jest.fn().mockResolvedValue({ ...mockPaper, items: [] }),
      },
    } as any;
    const service = new ExamPaperPdfService(prisma);

    await expect(service.exportPaperPdf('session-1', 'combined')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
