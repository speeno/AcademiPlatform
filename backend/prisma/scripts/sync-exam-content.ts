import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  ExamPaperStatus,
  Prisma,
  PrismaClient,
  QuestionDifficulty,
  QuestionType,
} from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

type ExportedOption = {
  id: string;
  label: string;
  text: string;
  order: number;
};

type ExportedAnswerKey = {
  id: string;
  optionId: string | null;
  textPattern: string | null;
  points: number;
  explanation: string | null;
};

type ExportedQuestion = {
  id: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  prompt: string;
  explanation: string | null;
  points: number;
  tags: string[];
  version: number;
  isActive: boolean;
  options: ExportedOption[];
  answerKeys: ExportedAnswerKey[];
};

type ExportedQuestionBank = {
  id: string;
  title: string;
  description: string | null;
  qualificationName: string | null;
  subject: string | null;
  isActive: boolean;
  questions: ExportedQuestion[];
};

type ExportedPaperSection = {
  id: string;
  title: string;
  order: number;
};

type ExportedPaperItem = {
  id: string;
  sectionId: string | null;
  questionId: string;
  order: number;
  points: number;
  required: boolean;
  scoringPolicy: Prisma.JsonValue | null;
};

type ExportedExamPaper = {
  id: string;
  title: string;
  description: string | null;
  status: ExamPaperStatus;
  totalPoints: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  publishedAt: string | null;
  session: {
    qualificationName: string;
    roundName: string;
  };
  sections: ExportedPaperSection[];
  items: ExportedPaperItem[];
};

type ExamContentBundle = {
  version: 1;
  exportedAt: string;
  questionBanks: ExportedQuestionBank[];
  examPapers: ExportedExamPaper[];
};

function createPrisma(url: string) {
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
}

function parseArgs(argv: string[]) {
  const command = argv[0] ?? 'help';
  const flags = new Map<string, string | boolean>();
  for (let i = 1; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      flags.set(key, true);
    } else {
      flags.set(key, next);
      i += 1;
    }
  }
  return { command, flags };
}

function defaultOutPath() {
  return resolve(process.cwd(), 'debug/exam-content-export.json');
}

async function exportBundle(prisma: PrismaClient): Promise<ExamContentBundle> {
  const banks = await prisma.questionBank.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      questions: {
        orderBy: { createdAt: 'asc' },
        include: {
          options: { orderBy: { order: 'asc' } },
          answerKeys: true,
        },
      },
    },
  });

  const papers = await prisma.examPaper.findMany({
    where: { status: { not: ExamPaperStatus.ARCHIVED } },
    orderBy: { createdAt: 'asc' },
    include: {
      examSession: {
        select: { qualificationName: true, roundName: true },
      },
      sections: { orderBy: { order: 'asc' } },
      items: { orderBy: { order: 'asc' } },
    },
  });

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    questionBanks: banks.map((bank) => ({
      id: bank.id,
      title: bank.title,
      description: bank.description,
      qualificationName: bank.qualificationName,
      subject: bank.subject,
      isActive: bank.isActive,
      questions: bank.questions.map((question) => ({
        id: question.id,
        type: question.type,
        difficulty: question.difficulty,
        prompt: question.prompt,
        explanation: question.explanation,
        points: question.points,
        tags: question.tags,
        version: question.version,
        isActive: question.isActive,
        options: question.options.map((option) => ({
          id: option.id,
          label: option.label,
          text: option.text,
          order: option.order,
        })),
        answerKeys: question.answerKeys.map((key) => ({
          id: key.id,
          optionId: key.optionId,
          textPattern: key.textPattern,
          points: key.points,
          explanation: key.explanation,
        })),
      })),
    })),
    examPapers: papers.map((paper) => ({
      id: paper.id,
      title: paper.title,
      description: paper.description,
      status: paper.status,
      totalPoints: paper.totalPoints,
      shuffleQuestions: paper.shuffleQuestions,
      shuffleOptions: paper.shuffleOptions,
      publishedAt: paper.publishedAt?.toISOString() ?? null,
      session: {
        qualificationName: paper.examSession.qualificationName,
        roundName: paper.examSession.roundName,
      },
      sections: paper.sections.map((section) => ({
        id: section.id,
        title: section.title,
        order: section.order,
      })),
      items: paper.items.map((item) => ({
        id: item.id,
        sectionId: item.sectionId,
        questionId: item.questionId,
        order: item.order,
        points: item.points,
        required: item.required,
        scoringPolicy: item.scoringPolicy,
      })),
    })),
  };
}

async function importQuestionBank(
  tx: Prisma.TransactionClient,
  bank: ExportedQuestionBank,
  dryRun: boolean,
) {
  if (!dryRun) {
    await tx.questionBank.upsert({
      where: { id: bank.id },
      create: {
        id: bank.id,
        title: bank.title,
        description: bank.description,
        qualificationName: bank.qualificationName,
        subject: bank.subject,
        isActive: bank.isActive,
      },
      update: {
        title: bank.title,
        description: bank.description,
        qualificationName: bank.qualificationName,
        subject: bank.subject,
        isActive: bank.isActive,
      },
    });
  }

  for (const question of bank.questions) {
    if (!dryRun) {
      await tx.question.upsert({
        where: { id: question.id },
        create: {
          id: question.id,
          bankId: bank.id,
          type: question.type,
          difficulty: question.difficulty,
          prompt: question.prompt,
          explanation: question.explanation,
          points: question.points,
          tags: question.tags,
          version: question.version,
          isActive: question.isActive,
        },
        update: {
          bankId: bank.id,
          type: question.type,
          difficulty: question.difficulty,
          prompt: question.prompt,
          explanation: question.explanation,
          points: question.points,
          tags: question.tags,
          version: question.version,
          isActive: question.isActive,
        },
      });

      await tx.questionOption.deleteMany({ where: { questionId: question.id } });
      if (question.options.length > 0) {
        await tx.questionOption.createMany({
          data: question.options.map((option) => ({
            id: option.id,
            questionId: question.id,
            label: option.label,
            text: option.text,
            order: option.order,
          })),
        });
      }

      await tx.questionAnswerKey.deleteMany({ where: { questionId: question.id } });
      if (question.answerKeys.length > 0) {
        await tx.questionAnswerKey.createMany({
          data: question.answerKeys.map((key) => ({
            id: key.id,
            questionId: question.id,
            optionId: key.optionId,
            textPattern: key.textPattern,
            points: key.points,
            explanation: key.explanation,
          })),
        });
      }
    }
  }

  return bank.questions.length;
}

async function importExamPaper(
  prisma: PrismaClient,
  paper: ExportedExamPaper,
  dryRun: boolean,
) {
  const session = await prisma.examSession.findFirst({
    where: {
      qualificationName: paper.session.qualificationName,
      roundName: paper.session.roundName,
    },
    select: { id: true },
  });

  if (!session) {
    console.warn(
      `[skip] 시험지 "${paper.title}" — 온라인 DB에 회차 없음: ${paper.session.qualificationName} / ${paper.session.roundName}`,
    );
    return false;
  }

  const missingQuestionIds = paper.items
    .map((item) => item.questionId)
    .filter((questionId) => questionId);
  const existingQuestions = await prisma.question.findMany({
    where: { id: { in: missingQuestionIds } },
    select: { id: true },
  });
  if (existingQuestions.length !== missingQuestionIds.length) {
    const existingSet = new Set(existingQuestions.map((q) => q.id));
    const missing = missingQuestionIds.filter((id) => !existingSet.has(id));
    console.warn(
      `[skip] 시험지 "${paper.title}" — 문항 ID 미존재: ${missing.join(', ')}`,
    );
    return false;
  }

  if (dryRun) {
    console.log(
      `[dry-run] 시험지 "${paper.title}" → ${paper.session.qualificationName} ${paper.session.roundName} (${paper.items.length}문항)`,
    );
    return true;
  }

  await prisma.$transaction(async (tx) => {
    const existing = await tx.examPaper.findFirst({
      where: {
        examSessionId: session.id,
        status: { not: ExamPaperStatus.ARCHIVED },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    const paperId = existing?.id ?? paper.id;

    await tx.examPaper.upsert({
      where: { id: paperId },
      create: {
        id: paperId,
        examSessionId: session.id,
        title: paper.title,
        description: paper.description,
        status: paper.status,
        totalPoints: paper.totalPoints,
        shuffleQuestions: paper.shuffleQuestions,
        shuffleOptions: paper.shuffleOptions,
        publishedAt: paper.publishedAt ? new Date(paper.publishedAt) : null,
      },
      update: {
        examSessionId: session.id,
        title: paper.title,
        description: paper.description,
        status: paper.status,
        totalPoints: paper.totalPoints,
        shuffleQuestions: paper.shuffleQuestions,
        shuffleOptions: paper.shuffleOptions,
        publishedAt: paper.publishedAt ? new Date(paper.publishedAt) : null,
      },
    });

    await tx.examPaperItem.deleteMany({ where: { paperId } });
    await tx.examPaperSection.deleteMany({ where: { paperId } });

    if (paper.sections.length > 0) {
      await tx.examPaperSection.createMany({
        data: paper.sections.map((section) => ({
          id: section.id,
          paperId,
          title: section.title,
          order: section.order,
        })),
      });
    }

    if (paper.items.length > 0) {
      await tx.examPaperItem.createMany({
        data: paper.items.map((item) => ({
          id: item.id,
          paperId,
          sectionId: item.sectionId,
          questionId: item.questionId,
          order: item.order,
          points: item.points,
          required: item.required,
          scoringPolicy:
            item.scoringPolicy === null
              ? Prisma.JsonNull
              : (item.scoringPolicy as Prisma.InputJsonValue),
        })),
      });
    }
  });

  console.log(
    `[ok] 시험지 "${paper.title}" → ${paper.session.qualificationName} ${paper.session.roundName}`,
  );
  return true;
}

async function importBundle(prisma: PrismaClient, bundle: ExamContentBundle, dryRun: boolean) {
  let questionCount = 0;
  for (const bank of bundle.questionBanks) {
    const count = await prisma.$transaction(async (tx) =>
      importQuestionBank(tx, bank, dryRun),
    );
    questionCount += count;
    console.log(
      `${dryRun ? '[dry-run] ' : ''}문제은행 "${bank.title}" — 문항 ${count}건`,
    );
  }

  let paperCount = 0;
  for (const paper of bundle.examPapers) {
    const ok = await importExamPaper(prisma, paper, dryRun);
    if (ok) paperCount += 1;
  }

  console.log(
    `\n완료: 문제은행 ${bundle.questionBanks.length}개, 문항 ${questionCount}건, 시험지 ${paperCount}/${bundle.examPapers.length}건`,
  );
}

function loadBundle(path: string): ExamContentBundle {
  const raw = readFileSync(path, 'utf8');
  const parsed = JSON.parse(raw) as ExamContentBundle;
  if (parsed.version !== 1 || !Array.isArray(parsed.questionBanks)) {
    throw new Error('지원하지 않는 export 파일 형식입니다.');
  }
  return parsed;
}

function printHelp() {
  console.log(`
로컬 DB → 온라인 DB 문제은행·시험지 동기화

사용법:
  npm run exam:content:export
  npm run exam:content:import
  npm run exam:content:sync

명령:
  export   로컬 DATABASE_URL에서 JSON 추출 (기본: debug/exam-content-export.json)
  import   JSON을 TARGET_DATABASE_URL(또는 DATABASE_URL)에 반영
  sync     export + import 한 번에 (SOURCE_DATABASE_URL → TARGET_DATABASE_URL)

환경변수:
  DATABASE_URL           export/import 기본 DB
  SOURCE_DATABASE_URL    sync·export 소스 (없으면 DATABASE_URL)
  TARGET_DATABASE_URL    sync·import 대상 (필수)

옵션:
  --out <path>           export 파일 경로
  --in <path>            import 파일 경로
  --dry-run              import 시 DB 쓰기 없이 검증만
`);
}

async function main() {
  const { command, flags } = parseArgs(process.argv.slice(2));
  const outPath =
    typeof flags.get('out') === 'string' ? String(flags.get('out')) : defaultOutPath();
  const inPath =
    typeof flags.get('in') === 'string' ? String(flags.get('in')) : defaultOutPath();
  const dryRun = flags.get('dry-run') === true;

  if (command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  if (command === 'export') {
    const sourceUrl = process.env.SOURCE_DATABASE_URL ?? process.env.DATABASE_URL;
    if (!sourceUrl) throw new Error('SOURCE_DATABASE_URL 또는 DATABASE_URL이 필요합니다.');

    const prisma = createPrisma(sourceUrl);
    try {
      const bundle = await exportBundle(prisma);
      mkdirSync(dirname(outPath), { recursive: true });
      writeFileSync(outPath, JSON.stringify(bundle, null, 2), 'utf8');
      console.log(
        `export 완료: ${outPath}\n문제은행 ${bundle.questionBanks.length}개, 시험지 ${bundle.examPapers.length}개`,
      );
    } finally {
      await prisma.$disconnect();
    }
    return;
  }

  if (command === 'import') {
    const targetUrl = process.env.TARGET_DATABASE_URL ?? process.env.DATABASE_URL;
    if (!targetUrl) throw new Error('TARGET_DATABASE_URL 또는 DATABASE_URL이 필요합니다.');
    if (!existsSync(inPath)) throw new Error(`import 파일 없음: ${inPath}`);

    const bundle = loadBundle(inPath);
    const prisma = createPrisma(targetUrl);
    try {
      await importBundle(prisma, bundle, dryRun);
    } finally {
      await prisma.$disconnect();
    }
    return;
  }

  if (command === 'sync') {
    const sourceUrl = process.env.SOURCE_DATABASE_URL ?? process.env.DATABASE_URL;
    const targetUrl = process.env.TARGET_DATABASE_URL;
    if (!sourceUrl) throw new Error('SOURCE_DATABASE_URL 또는 DATABASE_URL이 필요합니다.');
    if (!targetUrl) throw new Error('TARGET_DATABASE_URL이 필요합니다.');

    const source = createPrisma(sourceUrl);
    const target = createPrisma(targetUrl);
    try {
      const bundle = await exportBundle(source);
      mkdirSync(dirname(outPath), { recursive: true });
      writeFileSync(outPath, JSON.stringify(bundle, null, 2), 'utf8');
      console.log(`중간 저장: ${outPath}`);
      await importBundle(target, bundle, dryRun);
    } finally {
      await source.$disconnect();
      await target.$disconnect();
    }
    return;
  }

  printHelp();
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
