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

const COURSE_SLUG = 'iso-ai-creator';
const COURSE_TITLE = 'ISO/IEC 17024 AI Creator — 인공지능지도사 크리에이터';
const COURSE_DESCRIPTION =
  'ISO/IEC 17024 국제표준(SCC/IQCS 승인) 기반 AI Creator 자격증 대비 온라인 30강 과정입니다. ' +
  '딥러닝 기초부터 GANs·NST·AI 음악·VR·메타버스까지 생성형 AI 콘텐츠 제작 실무를 단계적으로 학습합니다.';
const COURSE_TAGS = ['ISO/IEC 17024', 'AI Creator', '생성형 AI', '딥러닝', 'GANs', 'NST', 'AI 음악', '메타버스'];
const COURSE_CATEGORY = 'AI 국제자격증';
const DOCS_ROOT = resolve(process.cwd(), '../docs/courses/iso-ai-creator');

// ── 커리큘럼 정의 ───────────────────────────────────────────────────────────

interface LectureDef { no: number; title: string }

const MODULES: Array<{ title: string; lectures: LectureDef[] }> = [
  {
    title: '기본 과정',
    lectures: [
      { no: 1, title: 'OT & 생성형 콘텐츠 AI 큰 그림 (Pre-test 대비)' },
      { no: 2, title: '딥러닝의 이해' },
      { no: 3, title: '인공 신경망의 기본 구조' },
      { no: 4, title: '딥러닝의 학습 원리' },
      { no: 5, title: 'CNN (합성곱 신경망)' },
      { no: 6, title: 'RNN·LSTM (순차 데이터)' },
      { no: 7, title: '딥러닝의 응용과 윤리' },
      { no: 8, title: 'GANs 핵심 개념 ①' },
      { no: 9, title: 'GANs 작동 방식 ②' },
      { no: 10, title: 'GANs 한계와 발전' },
      { no: 11, title: 'GANs의 응용' },
      { no: 12, title: 'GANs의 윤리' },
      { no: 13, title: '신경망 스타일 전이(NST) ①' },
      { no: 14, title: 'NST ② CNN과 그람 행렬' },
      { no: 15, title: 'NST ③ 3대 손실과 최적화' },
      { no: 16, title: 'NST 활용 사례' },
      { no: 17, title: 'AI 음악 ① 작곡·멜로디 생성' },
      { no: 18, title: 'AI 음악 ② 심볼릭 vs 오디오' },
      { no: 19, title: 'AI 음악 플랫폼·윤리' },
      { no: 20, title: 'AI와 VR·미디어 혁신' },
      { no: 21, title: '메타버스·AI 3D 환경 생성' },
      { no: 22, title: '1차 모의고사 + 해설' },
    ],
  },
  {
    title: '심화 과정',
    lectures: [
      { no: 23, title: '이미지 생성 실습' },
      { no: 24, title: '스타일 전이·이미지 편집 실습' },
      { no: 25, title: 'AI 영상·애니메이션 제작 실습' },
      { no: 26, title: 'AI 음악·오디오 제작 실습' },
      { no: 27, title: '3D·메타버스 콘텐츠 제작 실습' },
      { no: 28, title: '저작권·생성물 윤리 실무' },
      { no: 29, title: '캡스톤: 멀티미디어 포트폴리오' },
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
  return `docs/courses/iso-ai-creator/lectures/${String(no).padStart(2, '0')}/slides.pdf`;
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
      status: CmsContentStatus.PUBLISHED,
      latestVersionNo,
      publishedVersionNo: latestVersionNo,
      createdById: actorId,
      updatedById: actorId,
    },
    update: {
      contentType: CmsContentType.HTML,
      status: CmsContentStatus.PUBLISHED,
      latestVersionNo,
      publishedVersionNo: latestVersionNo,
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
    data: { contentStatus: 'PUBLISHED' },
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
      summary: 'ISO/IEC 17024 AI Creator 자격증 대비 30강 과정',
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
        `ISO AI Creator 강${lec.no} 시드 #${hash}`,
        forceContent,
      );
    }
  }

  console.log('\n✅ iso-ai-creator 30강 시드 완료\n');
}

run()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
