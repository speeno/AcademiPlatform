import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ExamMode, ExamPaperStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { buildExportFilename, resolveEdition } from './pdf/exam-paper-pdf.content';
import { renderAnswerKeyPdf } from './pdf/layouts/answer-key.layout';
import { renderCombinedExamPdf } from './pdf/layouts/combined-exam.layout';
import { renderStudentExamPdf } from './pdf/layouts/student-exam.layout';
import type {
  ExamPaperPdfBuildInput,
  PaperPdfExportResult,
  PaperPdfVariant,
} from './pdf/exam-paper-pdf.types';

export type { PaperPdfExportResult, PaperPdfVariant } from './pdf/exam-paper-pdf.types';

@Injectable()
export class ExamPaperPdfService {
  constructor(private readonly prisma: PrismaService) {}

  async exportPaperPdf(
    sessionId: string,
    variant: PaperPdfVariant,
  ): Promise<PaperPdfExportResult> {
    const input = await this.loadBuildInput(sessionId);
    const edition = resolveEdition(input.paper.status);

    let buffer: Buffer;
    if (variant === 'student') {
      buffer = await renderStudentExamPdf({ ...input, edition, variant });
    } else if (variant === 'answer') {
      buffer = await renderAnswerKeyPdf({ ...input, edition, variant });
    } else {
      buffer = await renderCombinedExamPdf({ ...input, edition, variant });
    }

    const filename = buildExportFilename(
      input.session.qualificationName,
      input.session.roundName,
      variant,
      edition,
    );

    return { buffer, filename };
  }

  private async loadBuildInput(sessionId: string): Promise<Omit<ExamPaperPdfBuildInput, 'edition' | 'variant'>> {
    const session = await this.prisma.examSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException('시험 회차를 찾을 수 없습니다.');
    }
    if (session.examMode !== ExamMode.OFFLINE && session.examMode !== ExamMode.HYBRID) {
      throw new BadRequestException('오프라인 또는 혼합 회차만 PDF로 출력할 수 있습니다.');
    }

    const paper = await this.prisma.examPaper.findFirst({
      where: { examSessionId: sessionId, status: { not: ExamPaperStatus.ARCHIVED } },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          orderBy: { order: 'asc' },
          include: {
            question: {
              include: {
                options: { orderBy: { order: 'asc' } },
                answerKeys: true,
              },
            },
          },
        },
      },
    });

    if (!paper || paper.items.length === 0) {
      throw new BadRequestException('출력할 시험 문항이 없습니다. 시험지를 저장한 뒤 다시 시도해주세요.');
    }

    return {
      session: {
        qualificationName: session.qualificationName,
        roundName: session.roundName,
        examAt: session.examAt,
        place: session.place,
        durationMinutes: session.durationMinutes,
        passingScore: session.passingScore,
      },
      paper: {
        title: paper.title,
        description: paper.description,
        status: paper.status,
        totalPoints: paper.totalPoints,
        items: paper.items.map((item) => ({
          order: item.order,
          points: item.points,
          question: {
            prompt: item.question.prompt,
            type: item.question.type,
            explanation: item.question.explanation,
            options: item.question.options.map((o) => ({
              id: o.id,
              label: o.label,
              text: o.text,
            })),
            answerKeys: item.question.answerKeys.map((k) => ({
              optionId: k.optionId,
              textPattern: k.textPattern,
              explanation: k.explanation,
            })),
          },
        })),
      },
    };
  }
}
