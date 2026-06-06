import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ExamAnswerStatus,
  ExamApplicationStatus,
  ExamAttemptStatus,
  ExamEligibilityStatus,
  ExamMode,
  ExamPaperStatus,
  ExamProctorEventType,
  ExamResultStatus,
  QuestionType,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotifyService } from '../notify/notify.service';

type Actor = { id: string; role?: UserRole };

function toDateOrNull(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

@Injectable()
export class OnlineExamService {
  constructor(
    private prisma: PrismaService,
    private notify: NotifyService,
  ) {}

  /* ── Admin: 문제은행 ─────────────────────────────────────── */

  async listQuestionBanks() {
    return this.prisma.questionBank.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { questions: true } } },
    });
  }

  async createQuestionBank(data: any) {
    if (!data?.title?.trim()) {
      throw new BadRequestException('문제은행 이름을 입력해주세요.');
    }
    return this.prisma.questionBank.create({
      data: {
        title: data.title.trim(),
        description: data.description ?? null,
        qualificationName: data.qualificationName ?? null,
        subject: data.subject ?? null,
        isActive: data.isActive ?? true,
      },
    });
  }

  async listQuestions(bankId?: string) {
    return this.prisma.question.findMany({
      where: { ...(bankId ? { bankId } : {}) },
      orderBy: { createdAt: 'desc' },
      include: {
        bank: { select: { id: true, title: true } },
        options: { orderBy: { order: 'asc' } },
        answerKeys: true,
      },
    });
  }

  async createQuestion(data: any) {
    if (!data?.bankId) throw new BadRequestException('문제은행을 선택해주세요.');
    if (!data?.prompt?.trim()) throw new BadRequestException('문제를 입력해주세요.');

    const type = data.type ?? QuestionType.SINGLE_CHOICE;
    const options = Array.isArray(data.options) ? data.options : [];
    const isChoice =
      type === QuestionType.SINGLE_CHOICE ||
      type === QuestionType.MULTIPLE_CHOICE;
    if (isChoice && options.length < 2) {
      throw new BadRequestException('객관식 문항은 보기 2개 이상이 필요합니다.');
    }

    const question = await this.prisma.question.create({
      data: {
        bankId: data.bankId,
        type,
        difficulty: data.difficulty ?? 'NORMAL',
        prompt: data.prompt.trim(),
        explanation: data.explanation ?? null,
        points: Number(data.points ?? 1),
        tags: Array.isArray(data.tags) ? data.tags : [],
        options: isChoice
          ? {
              create: options.map((option: any, index: number) => ({
                label: option.label || String.fromCharCode(65 + index),
                text: option.text,
                order: Number(option.order ?? index),
              })),
            }
          : undefined,
      },
      include: { options: { orderBy: { order: 'asc' } } },
    });

    const correctLabels = new Set<string>(
      Array.isArray(data.correctOptionLabels) ? data.correctOptionLabels : [],
    );
    const answerCreates =
      type === QuestionType.SHORT_TEXT || type === QuestionType.FILE_SUBMISSION
        ? [{ questionId: question.id, textPattern: data.textPattern ?? null, points: question.points }]
        : question.options
            .filter((option) => correctLabels.has(option.label))
            .map((option) => ({
              questionId: question.id,
              optionId: option.id,
              points: question.points,
              explanation: data.explanation ?? null,
            }));

    if (answerCreates.length === 0 && isChoice) {
      throw new BadRequestException('정답 보기를 1개 이상 선택해주세요.');
    }

    await this.prisma.questionAnswerKey.createMany({ data: answerCreates });
    return this.prisma.question.findUnique({
      where: { id: question.id },
      include: { options: { orderBy: { order: 'asc' } }, answerKeys: true },
    });
  }

  async updateQuestion(id: string, data: any) {
    const question = await this.prisma.question.findUnique({ where: { id } });
    if (!question) throw new NotFoundException('문항을 찾을 수 없습니다.');

    return this.prisma.question.update({
      where: { id },
      data: {
        ...(data.prompt !== undefined && { prompt: data.prompt }),
        ...(data.explanation !== undefined && { explanation: data.explanation }),
        ...(data.points !== undefined && { points: Number(data.points) }),
        ...(data.difficulty !== undefined && { difficulty: data.difficulty }),
        ...(data.tags !== undefined && { tags: Array.isArray(data.tags) ? data.tags : [] }),
        ...(data.isActive !== undefined && { isActive: !!data.isActive }),
        version: { increment: 1 },
      },
      include: { options: { orderBy: { order: 'asc' } }, answerKeys: true },
    });
  }

  /* ── Admin: 시험지 ───────────────────────────────────────── */

  async getPaper(sessionId: string) {
    return this.prisma.examPaper.findFirst({
      where: { examSessionId: sessionId },
      orderBy: { createdAt: 'desc' },
      include: {
        sections: { orderBy: { order: 'asc' } },
        items: {
          orderBy: { order: 'asc' },
          include: {
            question: {
              include: { options: { orderBy: { order: 'asc' } }, answerKeys: true },
            },
          },
        },
      },
    });
  }

  async upsertPaper(sessionId: string, data: any) {
    const session = await this.prisma.examSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('시험 회차를 찾을 수 없습니다.');

    const questionIds = Array.isArray(data.questionIds) ? data.questionIds : [];
    const questions = await this.prisma.question.findMany({
      where: { id: { in: questionIds }, isActive: true },
    });
    if (questions.length !== questionIds.length) {
      throw new BadRequestException('유효하지 않은 문항이 포함되어 있습니다.');
    }

    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    const existing = await this.prisma.examPaper.findFirst({
      where: { examSessionId: sessionId, status: { not: ExamPaperStatus.ARCHIVED } },
      orderBy: { createdAt: 'desc' },
    });

    const paper = existing
      ? await this.prisma.examPaper.update({
          where: { id: existing.id },
          data: {
            title: data.title || `${session.qualificationName} ${session.roundName}`,
            description: data.description ?? null,
            totalPoints,
            shuffleQuestions: data.shuffleQuestions ?? true,
            shuffleOptions: data.shuffleOptions ?? true,
            items: { deleteMany: {} },
          },
        })
      : await this.prisma.examPaper.create({
          data: {
            examSessionId: sessionId,
            title: data.title || `${session.qualificationName} ${session.roundName}`,
            description: data.description ?? null,
            totalPoints,
            shuffleQuestions: data.shuffleQuestions ?? true,
            shuffleOptions: data.shuffleOptions ?? true,
          },
        });

    await this.prisma.examPaperItem.createMany({
      data: questions.map((question, index) => ({
        paperId: paper.id,
        questionId: question.id,
        order: index,
        points: question.points,
      })),
    });

    return this.getPaper(sessionId);
  }

  async publishPaper(sessionId: string) {
    const paper = await this.getPaper(sessionId);
    if (!paper) throw new NotFoundException('시험지가 없습니다.');
    if (paper.items.length === 0) {
      throw new BadRequestException('게시하려면 문항이 1개 이상 필요합니다.');
    }
    return this.prisma.examPaper.update({
      where: { id: paper.id },
      data: { status: ExamPaperStatus.PUBLISHED, publishedAt: new Date() },
    });
  }

  async updateApplicationEligibility(
    applicationId: string,
    eligibility: ExamEligibilityStatus,
    actor: Actor,
  ) {
    return this.prisma.examApplication.update({
      where: { id: applicationId },
      data: {
        examEligibility: eligibility,
        approvedAt: eligibility === ExamEligibilityStatus.APPROVED ? new Date() : null,
        approvedById: eligibility === ExamEligibilityStatus.APPROVED ? actor.id : null,
      },
    });
  }

  async updateSessionOnlineSettings(sessionId: string, data: any) {
    return this.prisma.examSession.update({
      where: { id: sessionId },
      data: {
        examMode: data.examMode ?? ExamMode.ONLINE,
        examWindowStart: toDateOrNull(data.examWindowStart),
        examWindowEnd: toDateOrNull(data.examWindowEnd),
        durationMinutes: data.durationMinutes ? Number(data.durationMinutes) : null,
        lateEntryMinutes: Number(data.lateEntryMinutes ?? 0),
        requireFullscreen: !!data.requireFullscreen,
        requireWebcam: !!data.requireWebcam,
        passingScore: Number(data.passingScore ?? 60),
      },
    });
  }

  /* ── Candidate: 로비·응시 ───────────────────────────────── */

  async getLobby(sessionId: string, userId: string) {
    const application = await this.prisma.examApplication.findFirst({
      where: { examSessionId: sessionId, userId },
      include: {
        examSession: true,
        attempts: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!application) throw new NotFoundException('시험 접수 내역을 찾을 수 없습니다.');

    const paper = await this.prisma.examPaper.findFirst({
      where: { examSessionId: sessionId, status: ExamPaperStatus.PUBLISHED },
      include: { _count: { select: { items: true } } },
    });

    const now = new Date();
    const session = application.examSession;
    const canEnter =
      application.status === ExamApplicationStatus.APPLIED &&
      application.examEligibility === ExamEligibilityStatus.APPROVED &&
      !!paper &&
      !!session.examWindowStart &&
      !!session.examWindowEnd &&
      now >= session.examWindowStart &&
      now <= session.examWindowEnd;

    return {
      application,
      session,
      paper,
      existingAttempt: application.attempts[0] ?? null,
      canEnter,
      serverNow: now.toISOString(),
    };
  }

  async startAttempt(sessionId: string, userId: string) {
    const lobby = await this.getLobby(sessionId, userId);
    if (!lobby.canEnter) {
      throw new ForbiddenException('현재 온라인 시험에 입장할 수 없습니다.');
    }

    const existing = lobby.existingAttempt;
    if (existing && existing.status === ExamAttemptStatus.IN_PROGRESS) {
      return this.getAttempt(existing.id, userId);
    }
    if (existing) throw new BadRequestException('이미 제출된 시험입니다.');

    const session = lobby.session;
    const paper = await this.prisma.examPaper.findUnique({
      where: { id: lobby.paper!.id },
      include: {
        items: {
          orderBy: { order: 'asc' },
          include: { question: { include: { options: { orderBy: { order: 'asc' } } } } },
        },
      },
    });
    if (!paper || paper.items.length === 0) {
      throw new BadRequestException('게시된 시험지가 없습니다.');
    }

    const orderedItems = paper.shuffleQuestions ? shuffle(paper.items) : paper.items;
    const now = new Date();
    const hardEnd = session.examWindowEnd!;
    const durationEnd = new Date(
      now.getTime() + (session.durationMinutes ?? 60) * 60 * 1000,
    );
    const expiresAt = durationEnd < hardEnd ? durationEnd : hardEnd;

    const attempt = await this.prisma.examAttempt.create({
      data: {
        examSessionId: session.id,
        applicationId: lobby.application.id,
        userId,
        paperId: paper.id,
        expiresAt,
        questionOrder: orderedItems.map((item) => item.questionId),
        answers: {
          create: orderedItems.map((item) => ({
            questionId: item.questionId,
            selectedOptionIds: [],
            questionSnapshot: {
              prompt: item.question.prompt,
              type: item.question.type,
              version: item.question.version,
            },
            optionsSnapshot: paper.shuffleOptions
              ? shuffle(item.question.options)
              : item.question.options,
            pointsSnapshot: item.points,
          })),
        },
      },
    });

    return this.getAttempt(attempt.id, userId);
  }

  async getAttempt(attemptId: string, userId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        examSession: true,
        answers: {
          include: {
            question: {
              select: {
                id: true,
                type: true,
                prompt: true,
                points: true,
                options: { orderBy: { order: 'asc' } },
              },
            },
          },
        },
        result: true,
      },
    });
    if (!attempt) throw new NotFoundException('응시 세션을 찾을 수 없습니다.');
    if (attempt.userId !== userId) throw new ForbiddenException();

    const answerByQuestion = new Map(attempt.answers.map((a) => [a.questionId, a]));
    return {
      id: attempt.id,
      status: attempt.status,
      expiresAt: attempt.expiresAt,
      serverNow: new Date().toISOString(),
      session: attempt.examSession,
      result: attempt.result,
      questions: attempt.questionOrder
        .map((questionId) => answerByQuestion.get(questionId))
        .filter(Boolean)
        .map((answer) => ({
          answerId: answer!.id,
          questionId: answer!.questionId,
          question: answer!.question,
          selectedOptionIds: answer!.selectedOptionIds,
          textAnswer: answer!.textAnswer,
          fileUrl: answer!.fileUrl,
          fileName: answer!.fileName,
          savedAt: answer!.savedAt,
        })),
    };
  }

  private async assertMutableAttempt(attemptId: string, userId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt) throw new NotFoundException('응시 세션을 찾을 수 없습니다.');
    if (attempt.userId !== userId) throw new ForbiddenException();
    if (attempt.status !== ExamAttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('이미 제출된 시험입니다.');
    }
    if (attempt.expiresAt < new Date()) {
      await this.submitAttempt(attempt.id, userId);
      throw new BadRequestException('시험 시간이 종료되었습니다.');
    }
    return attempt;
  }

  async saveAnswer(attemptId: string, userId: string, data: any) {
    await this.assertMutableAttempt(attemptId, userId);
    if (!data?.questionId) throw new BadRequestException('문항 ID가 필요합니다.');

    return this.prisma.examAnswer.update({
      where: { attemptId_questionId: { attemptId, questionId: data.questionId } },
      data: {
        selectedOptionIds: Array.isArray(data.selectedOptionIds)
          ? data.selectedOptionIds
          : [],
        textAnswer: data.textAnswer ?? null,
        fileUrl: data.fileUrl ?? null,
        fileName: data.fileName ?? null,
        answerJson: data.answerJson ?? null,
        savedAt: new Date(),
      },
    });
  }

  async submitAttempt(attemptId: string, userId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: { answers: { include: { question: { include: { answerKeys: true } } } } },
    });
    if (!attempt) throw new NotFoundException('응시 세션을 찾을 수 없습니다.');
    if (attempt.userId !== userId) throw new ForbiddenException();
    if (attempt.status !== ExamAttemptStatus.IN_PROGRESS) return attempt;

    let needsManual = false;
    for (const answer of attempt.answers) {
      const maxPoints = answer.pointsSnapshot || answer.question.points;
      let score: number | null = null;
      let status: ExamAnswerStatus = ExamAnswerStatus.AUTO_GRADED;

      if (answer.question.type === QuestionType.SINGLE_CHOICE) {
        const correct = answer.question.answerKeys[0]?.optionId;
        score = correct && answer.selectedOptionIds[0] === correct ? maxPoints : 0;
      } else if (answer.question.type === QuestionType.MULTIPLE_CHOICE) {
        const correct = answer.question.answerKeys
          .map((key) => key.optionId)
          .filter(Boolean)
          .sort();
        const selected = [...answer.selectedOptionIds].sort();
        score = JSON.stringify(correct) === JSON.stringify(selected) ? maxPoints : 0;
      } else {
        needsManual = true;
        status = ExamAnswerStatus.SUBMITTED;
      }

      await this.prisma.examAnswer.update({
        where: { id: answer.id },
        data: {
          status,
          score,
          submittedAt: new Date(),
        },
      });
    }

    return this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: needsManual ? ExamAttemptStatus.MANUAL_GRADING : ExamAttemptStatus.AUTO_GRADED,
        submittedAt: new Date(),
      },
    });
  }

  /* ── Admin: 채점·결과 ───────────────────────────────────── */

  async listGradingQueue(sessionId: string) {
    return this.prisma.examAttempt.findMany({
      where: { examSessionId: sessionId, status: ExamAttemptStatus.MANUAL_GRADING },
      include: {
        user: { select: { id: true, name: true, email: true } },
        answers: {
          where: { status: ExamAnswerStatus.SUBMITTED },
          include: { question: true },
        },
      },
      orderBy: { submittedAt: 'asc' },
    });
  }

  async gradeAnswer(answerId: string, data: any, actor: Actor) {
    const answer = await this.prisma.examAnswer.findUnique({
      where: { id: answerId },
      include: { attempt: { include: { answers: true } } },
    });
    if (!answer) throw new NotFoundException('답안을 찾을 수 없습니다.');
    const score = Number(data.score ?? 0);
    if (score < 0 || score > answer.pointsSnapshot) {
      throw new BadRequestException('점수가 배점을 벗어났습니다.');
    }

    await this.prisma.examAnswer.update({
      where: { id: answerId },
      data: {
        score,
        feedback: data.feedback ?? null,
        status: ExamAnswerStatus.MANUAL_GRADED,
        gradedAt: new Date(),
        gradedById: actor.id,
      },
    });

    const remaining = await this.prisma.examAnswer.count({
      where: { attemptId: answer.attemptId, status: ExamAnswerStatus.SUBMITTED },
    });
    if (remaining === 0) {
      await this.finalizeAttempt(answer.attemptId);
    }
    return { ok: true };
  }

  async finalizeAttempt(attemptId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: { examSession: true, answers: true },
    });
    if (!attempt) throw new NotFoundException('응시 세션을 찾을 수 없습니다.');

    const maxScore = attempt.answers.reduce((sum, a) => sum + a.pointsSnapshot, 0);
    const totalScore = attempt.answers.reduce((sum, a) => sum + (a.score ?? 0), 0);
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const status =
      percentage >= attempt.examSession.passingScore
        ? ExamResultStatus.PASSED
        : ExamResultStatus.FAILED;

    await this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: { status: ExamAttemptStatus.GRADED },
    });

    return this.prisma.examResult.upsert({
      where: { attemptId },
      create: { attemptId, totalScore, maxScore, percentage, status },
      update: { totalScore, maxScore, percentage, status },
    });
  }

  async publishResult(attemptId: string, actor: Actor) {
    const result = await this.prisma.examResult.findUnique({
      where: { attemptId },
      include: {
        attempt: {
          include: {
            user: true,
            examSession: true,
          },
        },
      },
    });
    if (!result) throw new NotFoundException('채점 결과가 없습니다.');

    const published = await this.prisma.examResult.update({
      where: { id: result.id },
      data: { publishedAt: new Date(), publishedById: actor.id },
    });

    await this.notify.sendExamResult(
      result.attempt.user.email,
      result.attempt.user.name,
      `${result.attempt.examSession.qualificationName} ${result.attempt.examSession.roundName}`,
      result.totalScore,
      result.maxScore,
      result.status,
    );
    await this.prisma.examResult.update({
      where: { id: result.id },
      data: { emailSentAt: new Date() },
    });

    return published;
  }

  async getMyResult(attemptId: string, userId: string) {
    const result = await this.prisma.examResult.findUnique({
      where: { attemptId },
      include: { attempt: { include: { examSession: true } } },
    });
    if (!result || result.attempt.userId !== userId) throw new NotFoundException('결과가 없습니다.');
    if (!result.publishedAt) throw new ForbiddenException('아직 공개되지 않은 결과입니다.');
    return result;
  }

  /* ── 감독 이벤트 ───────────────────────────────────────── */

  async recordProctorEvent(attemptId: string, userId: string, data: any) {
    const attempt = await this.prisma.examAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt) throw new NotFoundException('응시 세션을 찾을 수 없습니다.');
    if (attempt.userId !== userId) throw new ForbiddenException();

    const type = data.type ?? ExamProctorEventType.HEARTBEAT;
    const [event] = await this.prisma.$transaction([
      this.prisma.examProctorEvent.create({
        data: { attemptId, type, payload: data.payload ?? null },
      }),
      this.prisma.examAttempt.update({
        where: { id: attemptId },
        data: {
          lastHeartbeatAt: type === ExamProctorEventType.HEARTBEAT ? new Date() : undefined,
          warningCount:
            type === ExamProctorEventType.HEARTBEAT ? undefined : { increment: 1 },
        },
      }),
    ]);
    return event;
  }

  async recordSnapshot(attemptId: string, userId: string, data: any) {
    const attempt = await this.prisma.examAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt) throw new NotFoundException('응시 세션을 찾을 수 없습니다.');
    if (attempt.userId !== userId) throw new ForbiddenException();

    return this.prisma.examProctorSnapshot.create({
      data: {
        attemptId,
        fileUrl: data.fileUrl,
        fileName: data.fileName ?? null,
        mimeType: data.mimeType ?? null,
      },
    });
  }

  async listProctorSession(sessionId: string) {
    return this.prisma.examAttempt.findMany({
      where: { examSessionId: sessionId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        proctorEvents: { orderBy: { occurredAt: 'desc' }, take: 10 },
        proctorSnapshots: { orderBy: { capturedAt: 'desc' }, take: 3 },
      },
      orderBy: { startedAt: 'desc' },
    });
  }
}
