import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  CmsContentStatus,
  CmsContentType,
  CourseStatus,
  LessonType,
} from '@prisma/client';
import * as dotenv from 'dotenv';

type ManifestLesson = {
  title: string;
  lessonType: LessonType;
  sourcePath?: string;
  inlineMarkdown?: string;
  sourceKind?: string;
};

type ManifestModule = {
  title: string;
  lessons: ManifestLesson[];
};

type ManifestAssignment = {
  title: string;
  description?: string;
  dueOffsetDays?: number;
};

type ManifestCourse = {
  title: string;
  slug: string;
  track: string;
  duration: string;
  summary?: string;
  description?: string;
  tags?: string[];
  modules: ManifestModule[];
  assignments?: ManifestAssignment[];
};

type Manifest = {
  version: number;
  defaultCategory?: string;
  courses: ManifestCourse[];
};

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter } as any);

function resolveExistingPath(candidates: string[]): string {
  for (const candidate of candidates) {
    const full = resolve(process.cwd(), candidate);
    if (existsSync(full)) return full;
  }
  throw new Error(
    `파일 경로를 찾지 못했습니다. 시도한 경로: ${candidates.join(', ')}`,
  );
}

function getArg(flag: string, fallback?: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

function markdownToHtml(md: string): string {
  const escaped = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/^\- (.*)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/^/, '<p>')
    .concat('</p>');
}

function readSourceMarkdown(
  curriculumRoot: string,
  lesson: ManifestLesson,
): string {
  if (lesson.inlineMarkdown) return lesson.inlineMarkdown;
  if (!lesson.sourcePath)
    return `${lesson.title}\n\n콘텐츠 원본 경로가 지정되지 않았습니다.`;
  const fullPath = resolve(curriculumRoot, lesson.sourcePath);
  if (!existsSync(fullPath)) {
    return `${lesson.title}\n\n원본 파일을 찾지 못했습니다: ${lesson.sourcePath}`;
  }
  return readFileSync(fullPath, 'utf-8');
}

async function ensureInstructorId(explicitId?: string): Promise<string> {
  if (explicitId) return explicitId;
  const operator = await prisma.user.findFirst({
    where: { role: { in: ['OPERATOR', 'SUPER_ADMIN'] } },
    select: { id: true },
  });
  if (operator?.id) return operator.id;
  const instructor = await prisma.user.findFirst({
    where: { role: 'INSTRUCTOR' },
    select: { id: true },
  });
  if (!instructor?.id)
    throw new Error(
      '강좌 생성용 instructorId를 찾을 수 없습니다. --instructor-id를 지정하세요.',
    );
  return instructor.id;
}

async function upsertCourse(
  courseDef: ManifestCourse,
  instructorId: string,
  defaultCategory: string,
) {
  return prisma.course.upsert({
    where: { slug: courseDef.slug },
    create: {
      title: courseDef.title,
      slug: courseDef.slug,
      category: defaultCategory,
      summary: courseDef.summary ?? '가격·일정 미정',
      description: courseDef.description ?? '',
      tags: courseDef.tags ?? [],
      price: 0,
      basePrice: 0,
      status: CourseStatus.DRAFT,
      instructorId,
      cmsOwnerId: instructorId,
    },
    update: {
      title: courseDef.title,
      category: defaultCategory,
      summary: courseDef.summary ?? '가격·일정 미정',
      description: courseDef.description ?? '',
      tags: courseDef.tags ?? [],
      price: 0,
      basePrice: 0,
      instructorId,
      cmsOwnerId: instructorId,
      enrollmentStartAt: null,
      enrollmentEndAt: null,
      maxCapacity: null,
    },
  });
}

async function upsertContentDraft(
  lessonId: string,
  courseId: string,
  actorId: string,
  html: string,
) {
  const item = await prisma.contentItem.findUnique({ where: { lessonId } });
  const latestVersionNo = (item?.latestVersionNo ?? 0) + 1;

  const upserted = await prisma.contentItem.upsert({
    where: { lessonId },
    create: {
      courseId,
      lessonId,
      contentType: CmsContentType.HTML,
      status: CmsContentStatus.DRAFT,
      latestVersionNo,
      createdById: actorId,
      updatedById: actorId,
    },
    update: {
      contentType: CmsContentType.HTML,
      status: CmsContentStatus.DRAFT,
      latestVersionNo,
      updatedById: actorId,
    },
  });

  await prisma.contentVersion.create({
    data: {
      itemId: upserted.id,
      versionNo: latestVersionNo,
      schemaJson: { html },
      changeNote: 'Harness 커리큘럼 1차 등록',
      createdById: actorId,
    },
  });

  await prisma.lesson.update({
    where: { id: lessonId },
    data: { contentStatus: 'DRAFT' },
  });
}

async function run() {
  const manifestPath =
    getArg('--manifest') !== undefined
      ? resolve(process.cwd(), getArg('--manifest')!)
      : resolveExistingPath([
          'data/curriculum/harness/manifest.yaml',
          '../data/curriculum/harness/manifest.yaml',
        ]);
  const curriculumRoot = resolve(
    getArg(
      '--curriculum-root',
      '/Users/speeno/ai-harness-training-curriculum',
    )!,
  );
  const mode = getArg('--mode', 'all');
  const instructorId = await ensureInstructorId(getArg('--instructor-id'));

  const raw = readFileSync(manifestPath, 'utf-8');
  const manifest = JSON.parse(raw) as Manifest;
  const filteredCourses = manifest.courses.filter((course) => {
    if (mode === 'pilot-1d') return course.duration === '1-day';
    return true;
  });

  for (const courseDef of filteredCourses) {
    const course = await upsertCourse(
      courseDef,
      instructorId,
      manifest.defaultCategory ?? 'AI Harness',
    );
    console.log(`course: ${course.slug}`);

    for (let mIdx = 0; mIdx < courseDef.modules.length; mIdx += 1) {
      const moduleDef = courseDef.modules[mIdx];
      const existingModule = await prisma.courseModule.findFirst({
        where: { courseId: course.id, title: moduleDef.title },
      });
      const module =
        existingModule ??
        (await prisma.courseModule.create({
          data: {
            courseId: course.id,
            title: moduleDef.title,
            sortOrder: mIdx + 1,
          },
        }));

      for (let lIdx = 0; lIdx < moduleDef.lessons.length; lIdx += 1) {
        const lessonDef = moduleDef.lessons[lIdx];
        const existingLesson = await prisma.lesson.findFirst({
          where: { moduleId: module.id, title: lessonDef.title },
        });
        const lesson =
          existingLesson ??
          (await prisma.lesson.create({
            data: {
              courseId: course.id,
              moduleId: module.id,
              title: lessonDef.title,
              lessonType: lessonDef.lessonType,
              description:
                lessonDef.sourcePath ?? lessonDef.inlineMarkdown ?? null,
              sortOrder: lIdx + 1,
              contentStatus: 'DRAFT',
              isPreview: false,
            },
          }));

        const markdown = readSourceMarkdown(curriculumRoot, lessonDef);
        const html = markdownToHtml(markdown);
        await upsertContentDraft(lesson.id, course.id, instructorId, html);
      }
    }

    for (const assignment of courseDef.assignments ?? []) {
      const existing = await prisma.assignment.findFirst({
        where: { courseId: course.id, title: assignment.title },
      });
      if (existing) continue;
      const dueAt = assignment.dueOffsetDays
        ? new Date(Date.now() + assignment.dueOffsetDays * 24 * 60 * 60 * 1000)
        : null;
      await prisma.assignment.create({
        data: {
          courseId: course.id,
          title: assignment.title,
          description: assignment.description ?? null,
          dueAt,
          allowResubmit: true,
          allowLateSubmit: true,
          maxFileSizeMb: 100,
          allowedFileTypes: ['pdf', 'md', 'txt', 'zip'],
        },
      });
    }
  }
}

run()
  .then(() => {
    console.log('harness curriculum import done');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
