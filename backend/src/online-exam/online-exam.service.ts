import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import {
  ExamAnswerStatus,
  ExamApplicationStatus,
  ExamAttemptStatus,
  ExamEligibilityStatus,
  ExamMode,
  ExamPaperStatus,
  ExamProctorEventType,
  ExamResultStatus,
  Prisma,
  QuestionDifficulty,
  QuestionType,
  UserRole,
} from '@prisma/client';
import { parseAppDateTime } from '../common/datetime/parse-app-datetime';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotifyService } from '../notify/notify.service';

type Actor = { id: string; role?: UserRole };
type QuestionSearchQuery = {
  bankId?: string;
  subject?: string;
  q?: string;
  keyword?: string;
  type?: QuestionType;
  difficulty?: QuestionDifficulty;
  isActive?: string | boolean;
  page?: string | number;
  limit?: string | number;
};
type AutoSelectRule = {
  type?: QuestionType;
  difficulty?: QuestionDifficulty;
  subject?: string;
  count?: number;
};

const MAX_QUESTION_SEARCH_LIMIT = 100;
const MAX_AUTO_SELECT_PER_RULE = 100;
const MAX_PAPER_QUESTIONS = 300;
const MAX_PROCTOR_SNAPSHOT_BYTES = 2 * 1024 * 1024;
const ALLOWED_PROCTOR_SNAPSHOT_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

type ExamScheduleSession = {
  examAt: Date;
  examWindowStart: Date | null;
  examWindowEnd: Date | null;
  durationMinutes: number | null;
  lateEntryMinutes: number;
};

function resolveEffectiveWindowStart(session: ExamScheduleSession): Date | null {
  const examAt = session.examAt ?? null;
  const configuredStart = session.examWindowStart ?? null;
  if (configuredStart && examAt) {
    return configuredStart.getTime() >= examAt.getTime() ? configuredStart : examAt;
  }
  return configuredStart ?? examAt;
}

function resolveExamSchedule(session: ExamScheduleSession) {
  if (!session.examWindowStart && !session.examWindowEnd) {
    return { isAnytimeMock: true, windowStart: null as Date | null, windowEnd: null as Date | null };
  }

  const windowStart = resolveEffectiveWindowStart(session);
  const durationMs = (session.durationMinutes ?? 60) * 60 * 1000;
  const lateEntryMs = (session.lateEntryMinutes ?? 0) * 60 * 1000;
  const windowEnd =
    session.examWindowEnd ??
    (windowStart ? new Date(windowStart.getTime() + durationMs + lateEntryMs) : null);

  return { isAnytimeMock: false, windowStart, windowEnd };
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function toPositiveInt(value: unknown, fallback: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(Math.floor(parsed), max);
}

function parseQuestionType(value: unknown): QuestionType | undefined {
  if (!value) return undefined;
  return Object.values(QuestionType).includes(value as QuestionType)
    ? (value as QuestionType)
    : undefined;
}

function parseQuestionDifficulty(value: unknown): QuestionDifficulty | undefined {
  if (!value) return undefined;
  return Object.values(QuestionDifficulty).includes(value as QuestionDifficulty)
    ? (value as QuestionDifficulty)
    : undefined;
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

  private buildQuestionWhere(query: QuestionSearchQuery = {}): Prisma.QuestionWhereInput {
    const keyword = String(query.q ?? query.keyword ?? '').trim();
    const subject = String(query.subject ?? '').trim();
    const type = parseQuestionType(query.type);
    const difficulty = parseQuestionDifficulty(query.difficulty);
    const where: Prisma.QuestionWhereInput = {
      ...(query.bankId ? { bankId: String(query.bankId) } : {}),
      ...(type ? { type } : {}),
      ...(difficulty ? { difficulty } : {}),
      ...(subject
        ? {
            bank: {
              subject: { contains: subject, mode: 'insensitive' },
            },
          }
        : {}),
    };

    if (query.isActive !== undefined) {
      where.isActive = query.isActive === true || String(query.isActive) === 'true';
    }
    if (keyword) {
      where.OR = [
        { prompt: { contains: keyword, mode: 'insensitive' } },
        { explanation: { contains: keyword, mode: 'insensitive' } },
        { tags: { has: keyword } },
      ];
    }

    return where;
  }

  async listQuestions(query: QuestionSearchQuery = {}) {
    const page = toPositiveInt(query.page, 1, 100000);
    const limit = toPositiveInt(query.limit, 20, MAX_QUESTION_SEARCH_LIMIT);
    const where = this.buildQuestionWhere(query);

    const [questions, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          bank: { select: { id: true, title: true } },
          options: { orderBy: { order: 'asc' } },
          answerKeys: true,
        },
      }),
      this.prisma.question.count({ where }),
    ]);

    return { questions, total, page, limit };
  }

  async listAllQuestionsForLegacy(bankId?: string) {
    return this.prisma.question.findMany({
      where: { ...(bankId ? { bankId } : {}), isActive: true },
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

    const nextType = parseQuestionType(data.type) ?? question.type;
    const isChoice =
      nextType === QuestionType.SINGLE_CHOICE ||
      nextType === QuestionType.MULTIPLE_CHOICE;
    const options = Array.isArray(data.options) ? data.options : undefined;
    const correctLabels = new Set<string>(
      Array.isArray(data.correctOptionLabels) ? data.correctOptionLabels : [],
    );

    if (isChoice && options && options.length < 2) {
      throw new BadRequestException('객관식 문항은 보기 2개 이상이 필요합니다.');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.question.update({
        where: { id },
        data: {
          ...(data.type !== undefined && { type: nextType }),
          ...(data.prompt !== undefined && { prompt: String(data.prompt).trim() }),
          ...(data.explanation !== undefined && { explanation: data.explanation }),
          ...(data.points !== undefined && { points: Number(data.points) }),
          ...(data.difficulty !== undefined && { difficulty: data.difficulty }),
          ...(data.tags !== undefined && { tags: Array.isArray(data.tags) ? data.tags : [] }),
          ...(data.isActive !== undefined && { isActive: !!data.isActive }),
          version: { increment: 1 },
        },
        include: { options: { orderBy: { order: 'asc' } } },
      });

      if (data.type !== undefined || options !== undefined || data.correctOptionLabels !== undefined) {
        await tx.questionAnswerKey.deleteMany({ where: { questionId: id } });

        if (isChoice) {
          await tx.questionOption.deleteMany({ where: { questionId: id } });
          const optionInputs = options ?? [];
          const createdOptions = await Promise.all(
            optionInputs.map((option: any, index: number) =>
              tx.questionOption.create({
                data: {
                  questionId: id,
                  label: option.label || String.fromCharCode(65 + index),
                  text: option.text,
                  order: Number(option.order ?? index),
                },
              }),
            ),
          );
          const answerCreates = createdOptions
            .filter((option) => correctLabels.has(option.label))
            .map((option) => ({
              questionId: id,
              optionId: option.id,
              points: updated.points,
              explanation: updated.explanation,
            }));
          if (answerCreates.length === 0) {
            throw new BadRequestException('정답 보기를 1개 이상 선택해주세요.');
          }
          await tx.questionAnswerKey.createMany({ data: answerCreates });
        } else {
          await tx.questionOption.deleteMany({ where: { questionId: id } });
          await tx.questionAnswerKey.create({
            data: {
              questionId: id,
              textPattern: data.textPattern ?? null,
              points: updated.points,
              explanation: updated.explanation,
            },
          });
        }
      }

      return tx.question.findUnique({
        where: { id },
        include: { options: { orderBy: { order: 'asc' } }, answerKeys: true },
      });
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

    const questionIds: string[] = Array.isArray(data.questionIds)
      ? Array.from(new Set<string>(data.questionIds.map((id: unknown) => String(id)).filter(Boolean)))
      : [];
    if (questionIds.length > MAX_PAPER_QUESTIONS) {
      throw new BadRequestException(`시험지는 최대 ${MAX_PAPER_QUESTIONS}문항까지 구성할 수 있습니다.`);
    }
    const questions = await this.prisma.question.findMany({
      where: { id: { in: questionIds }, isActive: true },
    });
    if (questions.length !== questionIds.length) {
      throw new BadRequestException('유효하지 않은 문항이 포함되어 있습니다.');
    }

    const questionById = new Map(questions.map((question) => [question.id, question]));
    const orderedQuestions = questionIds.map((questionId) => questionById.get(questionId)!);
    const totalPoints = orderedQuestions.reduce((sum, q) => sum + q.points, 0);
    const existing = await this.prisma.examPaper.findFirst({
      where: { examSessionId: sessionId, status: { not: ExamPaperStatus.ARCHIVED } },
      orderBy: { createdAt: 'desc' },
    });

    await this.prisma.$transaction(async (tx) => {
      const paper = existing
        ? await tx.examPaper.update({
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
        : await tx.examPaper.create({
            data: {
              examSessionId: sessionId,
              title: data.title || `${session.qualificationName} ${session.roundName}`,
              description: data.description ?? null,
              totalPoints,
              shuffleQuestions: data.shuffleQuestions ?? true,
              shuffleOptions: data.shuffleOptions ?? true,
            },
          });

      if (orderedQuestions.length > 0) {
        await tx.examPaperItem.createMany({
          data: orderedQuestions.map((question, index) => ({
            paperId: paper.id,
            questionId: question.id,
            order: index,
            points: question.points,
          })),
        });
      }
    });

    return this.getPaper(sessionId);
  }

  async autoSelectQuestions(data: any) {
    const rules = Array.isArray(data?.rules) ? data.rules : [];
    if (rules.length === 0) {
      throw new BadRequestException('자동 출제 규칙을 1개 이상 입력해주세요.');
    }

    const excludeIds = new Set<string>(
      Array.isArray(data?.excludeQuestionIds)
        ? data.excludeQuestionIds.map((id: unknown) => String(id)).filter(Boolean)
        : [],
    );
    const selectedIds = new Set<string>();
    const warnings: Array<{
      type: QuestionType;
      difficulty: QuestionDifficulty;
      requested: number;
      selected: number;
      available: number;
    }> = [];

    for (const rawRule of rules as AutoSelectRule[]) {
      const type = parseQuestionType(rawRule?.type);
      const difficulty = parseQuestionDifficulty(rawRule?.difficulty);
      const count = Math.min(Number(rawRule?.count ?? 0), MAX_AUTO_SELECT_PER_RULE);
      const subject = String((rawRule as { subject?: string })?.subject ?? '').trim();
      if (!type || !difficulty || !Number.isFinite(count) || count < 1) continue;

      const where: Prisma.QuestionWhereInput = {
        type,
        difficulty,
        isActive: true,
        id: { notIn: [...excludeIds, ...selectedIds] },
        ...(subject
          ? {
              bank: {
                subject: { contains: subject, mode: 'insensitive' },
              },
            }
          : {}),
      };
      const candidates = await this.prisma.question.findMany({
        where,
        select: { id: true },
      });
      const picked = shuffle(candidates).slice(0, count);
      picked.forEach((question) => selectedIds.add(question.id));
      if (picked.length < count) {
        warnings.push({
          type,
          difficulty,
          requested: count,
          selected: picked.length,
          available: candidates.length,
        });
      }
    }

    const selectedQuestionIds = [...selectedIds].slice(0, MAX_PAPER_QUESTIONS);
    const questions = selectedQuestionIds.length
      ? await this.prisma.question.findMany({
          where: { id: { in: selectedQuestionIds }, isActive: true },
          include: {
            bank: { select: { id: true, title: true } },
            options: { orderBy: { order: 'asc' } },
            answerKeys: true,
          },
        })
      : [];
    const questionById = new Map(questions.map((question) => [question.id, question]));

    return {
      selectedQuestionIds,
      selectedQuestions: selectedQuestionIds
        .map((questionId) => questionById.get(questionId))
        .filter(Boolean),
      warnings,
    };
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
        examWindowStart: parseAppDateTime(data.examWindowStart),
        examWindowEnd: parseAppDateTime(data.examWindowEnd),
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
    const form = application.formJson as Record<string, unknown> | null;
    const selectedExamMode =
      typeof form?.examMode === 'string' ? form.examMode.toUpperCase() : null;
    const allowsOnlineBySelection =
      selectedExamMode === ExamMode.ONLINE ||
      (selectedExamMode === null &&
        (session.examMode === ExamMode.ONLINE || session.examMode === ExamMode.HYBRID));
    const schedule = resolveExamSchedule(session);
    const { isAnytimeMock, windowStart, windowEnd } = schedule;
    const lobbyOpenAt = windowStart;
    const isEligibleAndReady =
      application.status === ExamApplicationStatus.APPLIED &&
      application.examEligibility === ExamEligibilityStatus.APPROVED &&
      !!paper &&
      allowsOnlineBySelection;
    const canStart =
      isEligibleAndReady &&
      (isAnytimeMock ||
        (!!windowStart && !!windowEnd && now >= windowStart && now <= windowEnd));
    const canEnterLobby = canStart;

    let startBlockedReason: string | null = null;
    if (!isEligibleAndReady) {
      if (application.status !== ExamApplicationStatus.APPLIED) {
        startBlockedReason = '접수 상태가 유효하지 않습니다.';
      } else if (application.examEligibility !== ExamEligibilityStatus.APPROVED) {
        startBlockedReason = '온라인 응시 승인이 필요합니다.';
      } else if (!paper) {
        startBlockedReason = '게시된 시험지가 없습니다.';
      } else if (!allowsOnlineBySelection) {
        startBlockedReason = '온라인 응시로 접수된 내역이 아닙니다.';
      }
    } else if (!isAnytimeMock) {
      if (!windowStart || !windowEnd) {
        startBlockedReason = '응시 시간이 설정되지 않았습니다.';
      } else if (now < windowStart) {
        startBlockedReason = '시험 시작 전입니다.';
      } else if (now > windowEnd) {
        startBlockedReason = '응시 시간이 종료되었습니다.';
      }
    }
    const participantApplications = await this.prisma.examApplication.findMany({
      where: {
        examSessionId: sessionId,
        status: ExamApplicationStatus.APPLIED,
        examEligibility: ExamEligibilityStatus.APPROVED,
      },
      select: {
        id: true,
        user: { select: { name: true, email: true } },
        formJson: true,
        attempts: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            startedAt: true,
          },
        },
      },
      orderBy: { appliedAt: 'asc' },
    });
    const participants = participantApplications
      .map((item) => {
        const latestAttempt = item.attempts[0] ?? null;
        const appForm = item.formJson as Record<string, unknown> | null;
        const status =
          latestAttempt?.status === ExamAttemptStatus.IN_PROGRESS
            ? 'IN_PROGRESS'
            : latestAttempt
              ? 'COMPLETED'
              : 'WAITING';
        return {
          id: item.id,
          name:
            item.user?.name ??
            (typeof appForm?.applicantName === 'string' ? appForm.applicantName : '응시자'),
          email: item.user?.email ?? (typeof appForm?.email === 'string' ? appForm.email : null),
          status,
          attemptId: latestAttempt?.id ?? null,
          startedAt: latestAttempt?.startedAt ?? null,
        };
      })
      .filter((item) => item.status === 'WAITING' || item.status === 'IN_PROGRESS');

    return {
      application,
      session,
      paper,
      existingAttempt: application.attempts[0] ?? null,
      canEnter: canStart,
      canStart,
      canEnterLobby,
      isAnytimeMock,
      effectiveWindowStart: windowStart?.toISOString() ?? null,
      effectiveWindowEnd: windowEnd?.toISOString() ?? null,
      startBlockedReason,
      lobbyOpenAt: lobbyOpenAt?.toISOString() ?? null,
      participants,
      serverNow: now.toISOString(),
    };
  }

  async startAttempt(sessionId: string, userId: string) {
    const lobby = await this.getLobby(sessionId, userId);
    if (!lobby.canStart) {
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
    const durationEnd = new Date(
      now.getTime() + (session.durationMinutes ?? 60) * 60 * 1000,
    );
    const hardEnd = lobby.effectiveWindowEnd
      ? new Date(lobby.effectiveWindowEnd)
      : durationEnd;
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

  private assertSnapshotUploadTarget(attemptId: string, userId: string) {
    return this.prisma.examAttempt.findUnique({ where: { id: attemptId } }).then((attempt) => {
      if (!attempt) throw new NotFoundException('응시 세션을 찾을 수 없습니다.');
      if (attempt.userId !== userId) throw new ForbiddenException();
      if (attempt.status !== ExamAttemptStatus.IN_PROGRESS) {
        throw new BadRequestException('응시 중에만 스냅샷을 저장할 수 있습니다.');
      }
      return attempt;
    });
  }

  private snapshotExtension(mimeType: string): string {
    if (mimeType === 'image/png') return 'png';
    if (mimeType === 'image/webp') return 'webp';
    return 'jpg';
  }

  private snapshotStoragePath(snapshotId: string, mimeType: string): string {
    return path.join(
      process.cwd(),
      'uploads',
      'proctor-snapshots',
      `${snapshotId}.${this.snapshotExtension(mimeType)}`,
    );
  }

  async uploadSnapshot(
    attemptId: string,
    userId: string,
    file:
      | {
          originalname?: string;
          mimetype?: string;
          buffer?: Buffer;
          size?: number;
        }
      | undefined,
  ) {
    await this.assertSnapshotUploadTarget(attemptId, userId);
    if (!file?.buffer || file.buffer.length === 0) {
      throw new BadRequestException('스냅샷 이미지를 업로드해주세요.');
    }

    const mimeType = file.mimetype?.toLowerCase();
    if (!mimeType || !ALLOWED_PROCTOR_SNAPSHOT_MIME_TYPES.has(mimeType)) {
      throw new BadRequestException('스냅샷은 JPG, PNG, WEBP 형식만 업로드할 수 있습니다.');
    }

    const size = file.size ?? file.buffer.length;
    if (size > MAX_PROCTOR_SNAPSHOT_BYTES) {
      throw new BadRequestException('스냅샷은 2MB 이하만 업로드할 수 있습니다.');
    }

    const snapshot = await this.prisma.examProctorSnapshot.create({
      data: {
        attemptId,
        fileUrl: 'pending',
        fileName: file.originalname ?? `proctor-${Date.now()}.${this.snapshotExtension(mimeType)}`,
        mimeType,
      },
    });

    const storagePath = this.snapshotStoragePath(snapshot.id, mimeType);
    await fs.mkdir(path.dirname(storagePath), { recursive: true });
    await fs.writeFile(storagePath, file.buffer);

    return this.prisma.examProctorSnapshot.update({
      where: { id: snapshot.id },
      data: { fileUrl: `/online-exam/admin/snapshots/${snapshot.id}/image` },
    });
  }

  async getSnapshotImage(snapshotId: string) {
    const snapshot = await this.prisma.examProctorSnapshot.findUnique({
      where: { id: snapshotId },
    });
    if (!snapshot) throw new NotFoundException('스냅샷을 찾을 수 없습니다.');

    const mimeType = snapshot.mimeType ?? 'image/jpeg';
    const storagePath = this.snapshotStoragePath(snapshot.id, mimeType);
    try {
      const buffer = await fs.readFile(storagePath);
      return {
        buffer,
        mimeType,
        fileName: snapshot.fileName ?? `${snapshot.id}.${this.snapshotExtension(mimeType)}`,
        size: buffer.length,
      };
    } catch {
      if (snapshot.fileUrl?.startsWith('http')) {
        throw new NotFoundException('외부 스냅샷 URL은 이 엔드포인트로 조회할 수 없습니다.');
      }
      throw new NotFoundException('스냅샷 파일을 찾을 수 없습니다.');
    }
  }

  async listProctorSession(sessionId: string) {
    return this.prisma.examAttempt.findMany({
      where: { examSessionId: sessionId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        proctorEvents: { orderBy: { occurredAt: 'desc' }, take: 10 },
        proctorSnapshots: { orderBy: { capturedAt: 'desc' }, take: 6 },
      },
      orderBy: { startedAt: 'desc' },
    });
  }
}
