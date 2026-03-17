import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  TextbookStatus,
  UserRole,
  UserStatus,
  CourseStatus,
  LessonType,
  EncodingStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter } as any);

// 환경변수 TEXTBOOK_STORAGE_PATH 우선 (Render Disk), 없으면 로컬 static 경로
const STATIC_TEXTBOOKS_DIR =
  process.env.TEXTBOOK_STORAGE_PATH ?? path.resolve(__dirname, '../static/textbooks');
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3300';

// 교재 데이터
const textbookData = [
  {
    key: 'ai-iso-creator',
    title: 'AI ISO Creator 과정 교재',
    description:
      'ISO 17024 AI 국제자격증 Creator 과정 공식 교재. 딥러닝, GANs(생성적 적대 신경망), 신경망 스타일 전이(NST), AI 음악 제작, AI 애니메이션 및 VR 콘텐츠 제작까지 AI 창작의 전 영역을 다룹니다.',
    localPath: path.join(STATIC_TEXTBOOKS_DIR, 'ai-iso-creator.pdf'),
    coverImageUrl: '/covers/ai-iso-creator.png',
    totalPages: 94,
    price: 0,
    isStandalone: false,
    status: TextbookStatus.PUBLISHED,
  },
  {
    key: 'ai-iso-prompt',
    title: 'AI ISO 프롬프트 과정 교재',
    description:
      'ISO 17024 AI 국제자격증 프롬프트 과정 공식 교재. 효과적인 AI 프롬프트 설계 방법론과 실무 활용 사례를 체계적으로 학습합니다.',
    localPath: path.join(STATIC_TEXTBOOKS_DIR, 'ai-iso-prompt.pdf'),
    coverImageUrl: '/covers/ai-iso-prompt.png',
    totalPages: 122,
    price: 0,
    isStandalone: false,
    status: TextbookStatus.PUBLISHED,
  },
  {
    key: 'ai-intro-vol1',
    title: 'AI 입문 실습서 1 — AI, 낯설지만 필요한 이야기',
    description:
      'AI를 처음 접하는 분들을 위한 실무 입문서 1권. AI를 사용하기 전 스스로에게 물어봐야 할 핵심 질문과 생성형 AI 비즈니스 도입 시 고려 사항을 알기 쉽게 설명합니다.',
    localPath: path.join(STATIC_TEXTBOOKS_DIR, 'ai-intro-vol1.pdf'),
    coverImageUrl: '/covers/ai-intro-vol1.png',
    totalPages: 112,
    price: 0,
    isStandalone: false,
    status: TextbookStatus.PUBLISHED,
  },
  {
    key: 'ai-intro-vol2',
    title: 'AI 입문 실습서 2 — AI, 낯설지만 필요한 이야기 v2',
    description:
      'AI 입문 실습서 2권(개정판). 생성형 AI 활용 심화 내용과 최신 AI 트렌드를 반영한 업데이트 버전입니다.',
    localPath: path.join(STATIC_TEXTBOOKS_DIR, 'ai-intro-vol2.pdf'),
    coverImageUrl: '/covers/ai-intro-vol2.png',
    totalPages: null,
    price: 0,
    isStandalone: false,
    status: TextbookStatus.PUBLISHED,
  },
];

// 코스 데이터
const courseData = [
  {
    slug: 'ai-expert-1',
    title: 'AI ISO 국제자격증 Creator 과정',
    description:
      'ISO 17024 기반 AI 국제자격증(Creator) 취득을 위한 공식 교육과정입니다. 딥러닝 핵심 이론부터 GANs를 활용한 AI 창작, AI 음악·애니메이션 실습까지 체계적으로 학습합니다.',
    summary: 'AI 창작 특화 ISO 17024 국제자격증 과정 — 딥러닝·GANs·AI 음악·AI 영상',
    thumbnailUrl: '/covers/ai-iso-creator.png',
    category: 'AI 국제자격증',
    tags: ['AI', 'ISO17024', '딥러닝', 'GAN', 'AI창작', '국제자격증'],
    price: 990000,
    status: CourseStatus.ACTIVE,
    isFeatured: true,
    learningPeriodDays: 180,
    textbookKey: 'ai-iso-creator',
    modules: [
      {
        title: '1모듈: 딥러닝 핵심 개념',
        lessons: [
          { title: '딥러닝이란 무엇인가', lessonType: LessonType.VIDEO_YOUTUBE, youtubeUrl: 'https://www.youtube.com/watch?v=aircAruvnKk' },
          { title: '신경망 구조와 학습 원리', lessonType: LessonType.TEXT },
          { title: '1모듈 교재 학습', lessonType: LessonType.DOCUMENT },
        ],
      },
      {
        title: '2모듈: GANs와 AI 창작',
        lessons: [
          { title: 'GAN 아키텍처 이해', lessonType: LessonType.VIDEO_YOUTUBE, youtubeUrl: 'https://www.youtube.com/watch?v=8L11aMN5KY8' },
          { title: 'NST(신경망 스타일 전이) 실습', lessonType: LessonType.TEXT },
        ],
      },
      {
        title: '3모듈: AI 음악 & AI 영상',
        lessons: [
          { title: 'AI 음악 생성 원리', lessonType: LessonType.VIDEO_YOUTUBE, youtubeUrl: 'https://www.youtube.com/watch?v=J06IlsPlYPM' },
          { title: 'AI 애니메이션 제작 실습', lessonType: LessonType.TEXT },
        ],
      },
    ],
  },
  {
    slug: 'ai-prompt-1',
    title: 'AI ISO 국제자격증 프롬프트 과정',
    description:
      'ISO 17024 기반 AI 프롬프트 전문가 국제자격증 취득 과정입니다. 생성형 AI를 효과적으로 활용하는 프롬프트 설계 방법론과 실무 적용 사례를 단계적으로 학습합니다.',
    summary: 'AI 프롬프트 전문가 ISO 17024 국제자격증 과정',
    thumbnailUrl: '/covers/ai-iso-prompt.png',
    category: 'AI 국제자격증',
    tags: ['AI', 'ISO17024', '프롬프트', 'ChatGPT', '생성형AI', '국제자격증'],
    price: 790000,
    status: CourseStatus.ACTIVE,
    isFeatured: true,
    learningPeriodDays: 120,
    textbookKey: 'ai-iso-prompt',
    modules: [
      {
        title: '1모듈: 프롬프트 엔지니어링 기초',
        lessons: [
          { title: '프롬프트 엔지니어링이란', lessonType: LessonType.VIDEO_YOUTUBE, youtubeUrl: 'https://www.youtube.com/watch?v=dOxUroR57xs' },
          { title: '효과적인 프롬프트 구성 방법', lessonType: LessonType.TEXT },
          { title: '1모듈 교재 학습', lessonType: LessonType.DOCUMENT },
        ],
      },
      {
        title: '2모듈: 업무 분야별 프롬프트 실습',
        lessons: [
          { title: '마케팅·콘텐츠 프롬프트', lessonType: LessonType.TEXT },
          { title: '코딩·개발 프롬프트', lessonType: LessonType.TEXT },
          { title: '데이터 분석 프롬프트', lessonType: LessonType.TEXT },
        ],
      },
    ],
  },
  {
    slug: 'ai-intro-basic',
    title: 'AI 입문 과정 1 — AI, 낯설지만 필요한 이야기',
    description:
      'AI가 낯선 직장인·관리자를 위한 실무 중심 AI 입문 과정입니다. AI를 도입하기 전 알아야 할 핵심 개념, 비즈니스 적용 전략, 리스크 관리까지 실무 사례 중심으로 학습합니다.',
    summary: '직장인·관리자를 위한 AI 실무 입문서 기반 온라인 과정',
    thumbnailUrl: '/covers/ai-intro-vol1.png',
    category: 'AI 입문',
    tags: ['AI입문', '생성형AI', '비즈니스AI', '실무', '입문'],
    price: 0,
    status: CourseStatus.ACTIVE,
    isFeatured: false,
    learningPeriodDays: 60,
    textbookKey: 'ai-intro-vol1',
    modules: [
      {
        title: '1모듈: AI를 왜 배워야 하는가',
        lessons: [
          { title: 'AI 시대, 나는 무엇을 해야 하나', lessonType: LessonType.VIDEO_YOUTUBE, youtubeUrl: 'https://www.youtube.com/watch?v=2ePf9rue1Ao' },
          { title: 'AI 도입 전 자문 목록', lessonType: LessonType.TEXT },
          { title: '1모듈 교재 학습', lessonType: LessonType.DOCUMENT },
        ],
      },
      {
        title: '2모듈: 생성형 AI 실무 활용',
        lessons: [
          { title: '업무에서 AI 사용하기', lessonType: LessonType.TEXT },
          { title: 'AI 리스크와 윤리', lessonType: LessonType.TEXT },
        ],
      },
    ],
  },
  {
    slug: 'ai-intro-advanced',
    title: 'AI 입문 과정 2 — AI, 낯설지만 필요한 이야기 v2',
    description:
      'AI 입문 실습서 2권을 기반으로 한 심화 입문 과정입니다. 최신 AI 트렌드와 생성형 AI 활용 심화 내용을 다루며, 실무 프로젝트 중심으로 진행됩니다.',
    summary: 'AI 입문 심화 — 생성형 AI 활용 실무 프로젝트 중심',
    thumbnailUrl: '/covers/ai-intro-vol2.png',
    category: 'AI 입문',
    tags: ['AI입문', '생성형AI', '심화', '실무프로젝트'],
    price: 0,
    status: CourseStatus.ACTIVE,
    isFeatured: false,
    learningPeriodDays: 60,
    textbookKey: 'ai-intro-vol2',
    modules: [
      {
        title: '1모듈: 최신 AI 트렌드',
        lessons: [
          { title: '2026년 AI 기술 동향', lessonType: LessonType.VIDEO_YOUTUBE, youtubeUrl: 'https://www.youtube.com/watch?v=G2fqAlgmoPo' },
          { title: '멀티모달 AI 이해', lessonType: LessonType.TEXT },
          { title: '1모듈 교재 학습', lessonType: LessonType.DOCUMENT },
        ],
      },
      {
        title: '2모듈: 실무 AI 프로젝트',
        lessons: [
          { title: 'AI 기반 업무 자동화 설계', lessonType: LessonType.TEXT },
          { title: '팀 단위 AI 도입 전략', lessonType: LessonType.TEXT },
        ],
      },
    ],
  },
];

async function main() {
  console.log('Seeding database...');

  // 관리자 계정 upsert
  const adminEmail = 'admin@academiq.kr';
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    const hashed = await bcrypt.hash('Admin1234!', 12);
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'AcademiQ 관리자',
        passwordHash: hashed,
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    console.log(`Created admin: ${adminEmail}`);
  } else {
    console.log(`Existing admin: ${adminEmail}`);
  }

  // 교재 4권 upsert (coverImageUrl 포함)
  const textbookIdMap: Record<string, string> = {};
  for (const tb of textbookData) {
    const { key, ...data } = tb;
    const existing = await prisma.textbook.findFirst({ where: { title: data.title } });
    let textbook;
    if (existing) {
      textbook = await prisma.textbook.update({
        where: { id: existing.id },
        data: {
          description: data.description,
          localPath: data.localPath,
          coverImageUrl: data.coverImageUrl,
          totalPages: data.totalPages,
          status: data.status,
        },
      });
      console.log(`Updated textbook: "${data.title}"`);
    } else {
      textbook = await prisma.textbook.create({
        data: { ...data, createdById: admin.id },
      });
      console.log(`Created textbook: "${data.title}"`);
    }
    textbookIdMap[key] = textbook.id;
  }

  // 코스 4개 upsert
  for (const course of courseData) {
    const { modules, textbookKey, ...courseFields } = course;

    let existingCourse = await prisma.course.findUnique({ where: { slug: courseFields.slug } });
    let courseId: string;

    if (existingCourse) {
      await prisma.course.update({
        where: { id: existingCourse.id },
        data: {
          title: courseFields.title,
          description: courseFields.description,
          summary: courseFields.summary,
          thumbnailUrl: courseFields.thumbnailUrl,
          category: courseFields.category,
          tags: courseFields.tags,
          price: courseFields.price,
          status: courseFields.status,
          isFeatured: courseFields.isFeatured,
          learningPeriodDays: courseFields.learningPeriodDays,
        },
      });
      courseId = existingCourse.id;
      console.log(`Updated course: "${courseFields.title}"`);
    } else {
      const created = await prisma.course.create({
        data: {
          ...courseFields,
          instructorId: admin.id,
        },
      });
      courseId = created.id;
      console.log(`Created course: "${courseFields.title}"`);
    }

    // 모듈 & 레슨 생성 (없으면만)
    const existingModules = await prisma.courseModule.findMany({ where: { courseId } });
    if (existingModules.length === 0) {
      for (let mIdx = 0; mIdx < modules.length; mIdx++) {
        const mod = modules[mIdx];
        const createdModule = await prisma.courseModule.create({
          data: {
            courseId,
            title: mod.title,
            sortOrder: mIdx,
          },
        });

        for (let lIdx = 0; lIdx < mod.lessons.length; lIdx++) {
          const lesson = mod.lessons[lIdx];
          const createdLesson = await prisma.lesson.create({
            data: {
              courseId,
              moduleId: createdModule.id,
              title: lesson.title,
              lessonType: lesson.lessonType,
              sortOrder: lIdx,
            },
          });

          // YouTube 레슨인 경우 LessonVideoAsset 생성
          if (lesson.lessonType === LessonType.VIDEO_YOUTUBE && 'youtubeUrl' in lesson) {
            await prisma.lessonVideoAsset.create({
              data: {
                lessonId: createdLesson.id,
                sourceType: 'YOUTUBE',
                youtubeUrl: lesson.youtubeUrl as string,
                encodingStatus: EncodingStatus.READY,
              },
            });
          }
        }
      }
      console.log(`  → Created ${modules.length} modules`);
    }

    // 교재-코스 연결 (없으면만)
    const textbookId = textbookIdMap[textbookKey];
    if (textbookId) {
      const existing = await prisma.courseTextbook.findFirst({
        where: { courseId, textbookId },
      });
      if (!existing) {
        await prisma.courseTextbook.create({
          data: { courseId, textbookId, sortOrder: 0, autoGrantOnEnroll: true },
        });
        console.log(`  → Linked textbook "${textbookKey}"`);
      }
    }
  }

  console.log('\nSeeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
