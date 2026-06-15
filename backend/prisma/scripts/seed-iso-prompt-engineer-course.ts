import { createHash } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  CmsContentStatus,
  CmsContentType,
  CourseStatus,
  LessonType,
  PrismaClient,
} from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter } as any);

// ── 강좌 메타 ──────────────────────────────────────────────────────────────

const COURSE_SLUG = 'iso-prompt-engineer';
const COURSE_TITLE = 'ISO/IEC 17024 AI Prompt Engineer — 인공지능지도사 프롬프트 엔지니어';
const COURSE_DESCRIPTION =
  'ISO/IEC 17024 국제표준(SCC/IQCS 승인) 기반 AI Prompt Engineer 자격증 대비 온라인 30강 과정입니다. ' +
  'AI 기초 이론부터 프롬프트 설계·RAG·멀티모달·AI 윤리까지 단계적으로 학습합니다.';
const COURSE_TAGS = ['ISO/IEC 17024', 'AI Prompt Engineer', '프롬프트 엔지니어링', 'NLP', 'GPT', '트랜스포머', 'RAG'];
const COURSE_CATEGORY = 'AI 국제자격증';
const DOCS_ROOT = resolve(process.cwd(), '../docs/courses/iso-prompt-engineer');

// ── 커리큘럼 정의 ───────────────────────────────────────────────────────────

interface LectureDef { no: number; title: string }

const MODULES: Array<{ title: string; lectures: LectureDef[] }> = [
  {
    title: '기본 과정',
    lectures: [
      { no: 1,  title: 'OT & AI 기본 소양 (Pre-test 대비)' },
      { no: 2,  title: 'AI의 정의와 분류' },
      { no: 3,  title: 'AI 핵심 구성요소' },
      { no: 4,  title: '약한 AI·강한 AI·AGI' },
      { no: 5,  title: 'AI 역사와 주요 이정표' },
      { no: 6,  title: 'AI 작동원리 ① 지도학습' },
      { no: 7,  title: 'AI 작동원리 ② 비지도·차이점' },
      { no: 8,  title: '자연어처리(NLP) ①' },
      { no: 9,  title: '자연어처리(NLP) ②' },
      { no: 10, title: '강화학습과 응용' },
      { no: 11, title: '컴퓨터 비전' },
      { no: 12, title: '멀티모달·AR·VR' },
      { no: 13, title: '어텐션 메커니즘 ①' },
      { no: 14, title: '어텐션 메커니즘 ②' },
      { no: 15, title: 'GPT vs 전통 검색' },
      { no: 16, title: '페르소나 기반 프롬프팅 ①' },
      { no: 17, title: '페르소나·롤플레잉 ②' },
      { no: 18, title: 'RLHF' },
      { no: 19, title: '딥페이크와 AI 윤리' },
      { no: 20, title: 'AI 채용 시스템 활용' },
      { no: 21, title: '1차 필기 총정리' },
      { no: 22, title: '1차 모의고사 + 해설' },
    ],
  },
  {
    title: '심화 과정',
    lectures: [
      { no: 23, title: '프롬프트 설계 원리' },
      { no: 24, title: '구조화·출력 제어·체이닝' },
      { no: 25, title: '페르소나·시스템 프롬프트 심화' },
      { no: 26, title: '멀티모달·자료결합(RAG 개념)' },
      { no: 27, title: '프롬프트 평가·반복 개선' },
      { no: 28, title: 'AI 윤리·안전 실무' },
      { no: 29, title: '캡스톤: 업무용 프롬프트 설계' },
      { no: 30, title: '2차 실기 모의 + 리뷰' },
    ],
  },
];

// ── 유틸리티 ────────────────────────────────────────────────────────────────

function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^\| .+ \|$/gm, (row) => {
      const cells = row.slice(1, -1).split('|').map((c) => `<td>${c.trim()}</td>`).join('');
      return `<tr>${cells}</tr>`;
    })
    .replace(/^\|[-:| ]+\|$/gm, '')
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/((?:<li>.+<\/li>\n?)+)/g, '<ul>$1</ul>')
    .replace(/((?:<tr>.+<\/tr>\n?)+)/g, '<table>$1</table>')
    .split(/\n\n+/)
    .map((para) => {
      const t = para.trim();
      if (!t) return '';
      if (/^<(h[1-3]|ul|table)/.test(t)) return t;
      return `<p>${t.replace(/\n/g, '<br/>')}</p>`;
    })
    .filter(Boolean)
    .join('\n');
}

function marpToHtml(content: string): { html: string; slideCount: number } {
  const withoutFrontmatter = content.replace(/^---[\s\S]*?---\s*\n/, '');
  const withoutComments = withoutFrontmatter.replace(/<!--[\s\S]*?-->/g, '');
  const slides = withoutComments.split(/\n---\n/).map((s) => s.trim()).filter(Boolean);
  const sections = slides.map((slide, i) => {
    const inner = markdownToHtml(slide);
    return `<section class="slide" data-slide="${i + 1}">\n${inner}\n</section>`;
  });
  return { html: sections.join('\n'), slideCount: slides.length };
}

function readSlidesHtml(no: number): { html: string; slideCount: number } {
  const dir = resolve(DOCS_ROOT, 'lectures', String(no).padStart(2, '0'));
  const slidesPath = resolve(dir, 'slides.md');
  if (!existsSync(slidesPath)) {
    console.warn(`  ⚠ slides.md 없음: ${slidesPath} — 빈 슬라이드로 처리`);
    return {
      html: `<section class="slide" data-slide="1"><h1>강 ${String(no).padStart(2, '0')}</h1></section>`,
      slideCount: 1,
    };
  }
  return marpToHtml(readFileSync(slidesPath, 'utf-8'));
}

function makePdfPath(no: number): string {
  return `docs/courses/iso-prompt-engineer/lectures/${String(no).padStart(2, '0')}/slides.pdf`;
}

async function ensureInstructorId(): Promise<string> {
  const u = await prisma.user.findFirst({
    where: { role: { in: ['OPERATOR', 'SUPER_ADMIN'] } },
    select: { id: true },
  });
  if (!u) throw new Error('강좌 생성용 instructorId를 찾을 수 없습니다. OPERATOR/SUPER_ADMIN 계정이 필요합니다.');
  return u.id;
}

async function upsertContentDraft(
  lessonId: string,
  courseId: string,
  actorId: string,
  html: string,
  slideCount: number,
  pdfFilePath: string,
  changeNote: string,
  forceContent: boolean,
): Promise<void> {
  const schemaJson = { html, pdfPath: pdfFilePath, slideCount };
  const item = await prisma.contentItem.findUnique({ where: { lessonId } });

  if (item && !forceContent) {
    const latest = await prisma.contentVersion.findFirst({
      where: { itemId: item.id, versionNo: item.latestVersionNo ?? 0 },
      select: { schemaJson: true },
    });
    const prevHtml =
      latest?.schemaJson && typeof latest.schemaJson === 'object' && 'html' in latest.schemaJson
        ? ((latest.schemaJson as { html: string }).html ?? '')
        : '';
    if (prevHtml === html) {
      process.stdout.write(' [skip]\n');
      return;
    }
  }

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
      schemaJson,
      changeNote,
      createdById: actorId,
    },
  });

  await prisma.lesson.update({
    where: { id: lessonId },
    data: { contentStatus: 'DRAFT' },
  });
  process.stdout.write(' [saved]\n');
}

// ── main ──────────────────────────────────────────────────────────────────

async function run() {
  const forceContent = process.argv.includes('--force-content');
  const instructorId = await ensureInstructorId();

  const course = await prisma.course.upsert({
    where: { slug: COURSE_SLUG },
    create: {
      title: COURSE_TITLE,
      slug: COURSE_SLUG,
      category: COURSE_CATEGORY,
      summary: 'ISO/IEC 17024 AI Prompt Engineer 자격증 대비 30강 과정',
      description: COURSE_DESCRIPTION,
      tags: COURSE_TAGS,
      price: 0,
      basePrice: 0,
      status: CourseStatus.DRAFT,
      instructorId,
      cmsOwnerId: instructorId,
    },
    update: {
      title: COURSE_TITLE,
      category: COURSE_CATEGORY,
      description: COURSE_DESCRIPTION,
      tags: COURSE_TAGS,
      instructorId,
      cmsOwnerId: instructorId,
    },
  });
  console.log(`\n✔ Course: ${course.slug} (id: ${course.id})`);

  for (let mIdx = 0; mIdx < MODULES.length; mIdx++) {
    const moduleDef = MODULES[mIdx];
    const existingModule = await prisma.courseModule.findFirst({
      where: { courseId: course.id, sortOrder: mIdx + 1 },
    });
    const courseModule = existingModule
      ? await prisma.courseModule.update({
          where: { id: existingModule.id },
          data: { title: moduleDef.title, sortOrder: mIdx + 1 },
        })
      : await prisma.courseModule.create({
          data: { courseId: course.id, title: moduleDef.title, sortOrder: mIdx + 1 },
        });
    console.log(`\n  📂 ${courseModule.title}`);

    for (let lIdx = 0; lIdx < moduleDef.lectures.length; lIdx++) {
      const lec = moduleDef.lectures[lIdx];
      const lessonTitle = `강 ${String(lec.no).padStart(2, '0')} — ${lec.title}`;

      const existingLesson = await prisma.lesson.findFirst({
        where: { moduleId: courseModule.id, sortOrder: lIdx + 1 },
      });
      const lesson = existingLesson
        ? await prisma.lesson.update({
            where: { id: existingLesson.id },
            data: {
              title: lessonTitle,
              lessonType: LessonType.DOCUMENT,
              sortOrder: lIdx + 1,
              contentStatus: 'DRAFT',
              isPreview: false,
            },
          })
        : await prisma.lesson.create({
            data: {
              courseId: course.id,
              moduleId: courseModule.id,
              title: lessonTitle,
              lessonType: LessonType.DOCUMENT,
              sortOrder: lIdx + 1,
              contentStatus: 'DRAFT',
              isPreview: false,
            },
          });

      const { html, slideCount } = readSlidesHtml(lec.no);
      const hash = createHash('sha256').update(html).digest('hex').slice(0, 10);
      process.stdout.write(`    강 ${String(lec.no).padStart(2, '0')} ${lec.title} (${slideCount}슬라이드)`);
      await upsertContentDraft(
        lesson.id,
        course.id,
        instructorId,
        html,
        slideCount,
        makePdfPath(lec.no),
        `ISO Prompt Engineer 강${lec.no} 시드 #${hash}`,
        forceContent,
      );
    }
  }

  console.log('\n✅ iso-prompt-engineer 30강 시드 완료\n');
}

run()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
