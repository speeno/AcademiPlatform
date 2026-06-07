/**
 * 시험지/정답지 PDF 레이아웃 샘플 생성 (로컬 QA용)
 * 실행: npx ts-node debug/generate-exam-pdf-sample.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { ExamMode, ExamPaperStatus, QuestionType } from '@prisma/client';
import { ExamPaperPdfService } from '../src/online-exam/exam-paper-pdf.service';

const session = {
  id: 'layout-qa',
  qualificationName: '인공지능 교육 지도사',
  roundName: '2026년 제1회',
  examAt: new Date('2026-06-04T22:00:00+09:00'),
  place: null,
  durationMinutes: null,
  passingScore: 60,
  examMode: ExamMode.OFFLINE,
};

const paper = {
  id: 'paper-qa',
  title: 'AI 크리에이터 전문가 2026년 제1회',
  description: null,
  status: ExamPaperStatus.DRAFT,
  totalPoints: 15,
  items: Array.from({ length: 5 }, (_, order) => ({
    order,
    points: 3,
    question: {
      prompt:
        order === 0
          ? '임베딩(Embedding)의 역할로 가장 적절한 것은?'
          : `샘플 문항 ${order + 1}입니다. 긴 지문이 포함된 경우 줄바꿈이 올바르게 처리되는지 확인합니다.`,
      type: QuestionType.SINGLE_CHOICE,
      explanation: '해설 텍스트입니다.',
      options: [
        { id: `o-${order}-1`, label: '①', text: '보기 A' },
        { id: `o-${order}-2`, label: '②', text: '보기 B' },
        { id: `o-${order}-3`, label: '③', text: '보기 C' },
        { id: `o-${order}-4`, label: '④', text: '보기 D' },
      ],
      answerKeys: [{ optionId: `o-${order}-2`, textPattern: null, explanation: '정답 해설' }],
    },
  })),
};

const prisma = {
  examSession: { findUnique: async () => session },
  examPaper: { findFirst: async () => paper },
} as any;

async function main() {

  const service = new ExamPaperPdfService(prisma);
  const outDir = path.join(__dirname, 'output');
  fs.mkdirSync(outDir, { recursive: true });

  for (const variant of ['student', 'answer', 'combined'] as const) {
    const { buffer, filename } = await service.exportPaperPdf(session.id, variant);
    const outPath = path.join(outDir, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`Wrote ${outPath} (${buffer.length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
