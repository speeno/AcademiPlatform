import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter } as any);

const DEFAULT_ADMIN_EMAIL = 'admin@academiq.kr';
const DEFAULT_ADMIN_PASSWORD = 'admin123';

async function seedAdminUser() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      name: 'AcademiQ 관리자',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
    update: {
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  console.log(`Admin user ready: ${user.email} (role=${user.role})`);
}

async function main() {
  console.log('Seeding database...');

  await seedAdminUser();

  // 홍보영상 갤러리 시드
  const shortsGalleryKey = 'shorts_gallery';
  const shortsDisplayKey = 'shorts_display';

  const existingShorts = await prisma.systemSetting.findUnique({ where: { key: shortsGalleryKey } });
  if (!existingShorts) {
    const shortsData = [
      { id: crypto.randomUUID(), type: 'youtube', videoId: '5KU6PXCfLtI', title: 'AI 자격증 소개', thumbnailUrl: '', linkUrl: '', isActive: true },
      { id: crypto.randomUUID(), type: 'youtube', videoId: 'lk34c7qwplw', title: 'AI 교육 하이라이트', thumbnailUrl: '', linkUrl: '', isActive: true },
      { id: crypto.randomUUID(), type: 'youtube', videoId: 'dQw4w9WgXcQ', title: 'AI 시대의 학습법', thumbnailUrl: '', linkUrl: '', isActive: true },
      { id: crypto.randomUUID(), type: 'youtube', videoId: 'jNQXAC9IVRw', title: 'AI 프롬프트 팁', thumbnailUrl: '', linkUrl: '', isActive: true },
      { id: crypto.randomUUID(), type: 'youtube', videoId: '9bZkp7q19f0', title: 'ISO 17024 국제자격', thumbnailUrl: '', linkUrl: '', isActive: true },
      { id: crypto.randomUUID(), type: 'youtube', videoId: 'kJQP7kiw5Fk', title: 'AI 창작 실습', thumbnailUrl: '', linkUrl: '', isActive: true },
      { id: crypto.randomUUID(), type: 'youtube', videoId: 'RgKAFK5djSk', title: '딥러닝 핵심 개념', thumbnailUrl: '', linkUrl: '', isActive: true },
      { id: crypto.randomUUID(), type: 'youtube', videoId: 'JGwWNGJdvx8', title: 'GAN 아키텍처 입문', thumbnailUrl: '', linkUrl: '', isActive: true },
      { id: crypto.randomUUID(), type: 'youtube', videoId: 'OPf0YbXqDm0', title: 'AI 음악 제작', thumbnailUrl: '', linkUrl: '', isActive: true },
      { id: crypto.randomUUID(), type: 'youtube', videoId: 'fJ9rUzIMcZQ', title: 'AI 영상 편집', thumbnailUrl: '', linkUrl: '', isActive: true },
      { id: crypto.randomUUID(), type: 'youtube', videoId: 'hT_nvWreIhg', title: 'AI 비즈니스 도입', thumbnailUrl: '', linkUrl: '', isActive: true },
      { id: crypto.randomUUID(), type: 'youtube', videoId: 'CevxZvSJLk8', title: 'AI 윤리와 리스크', thumbnailUrl: '', linkUrl: '', isActive: true },
      { id: crypto.randomUUID(), type: 'instagram', videoId: 'placeholder1', title: 'AI 교육 현장 스케치', thumbnailUrl: 'https://placehold.co/400x400/1A3F9C/white?text=AI+Education', linkUrl: 'https://www.instagram.com/', isActive: true },
      { id: crypto.randomUUID(), type: 'instagram', videoId: 'placeholder2', title: '수강생 인터뷰', thumbnailUrl: 'https://placehold.co/400x400/1A9AC5/white?text=Interview', linkUrl: 'https://www.instagram.com/', isActive: true },
      { id: crypto.randomUUID(), type: 'instagram', videoId: 'placeholder3', title: 'AI 자격증 취득 후기', thumbnailUrl: 'https://placehold.co/400x400/5AB85C/white?text=Review', linkUrl: 'https://www.instagram.com/', isActive: true },
      { id: crypto.randomUUID(), type: 'instagram', videoId: 'placeholder4', title: 'AI 실습 하이라이트', thumbnailUrl: 'https://placehold.co/400x400/F5A023/white?text=Highlight', linkUrl: 'https://www.instagram.com/', isActive: true },
      { id: crypto.randomUUID(), type: 'instagram', videoId: 'placeholder5', title: 'AI 트렌드 뉴스', thumbnailUrl: 'https://placehold.co/400x400/0F2771/white?text=Trend', linkUrl: 'https://www.instagram.com/', isActive: true },
      { id: crypto.randomUUID(), type: 'instagram', videoId: 'placeholder6', title: '강사진 소개', thumbnailUrl: 'https://placehold.co/400x400/DC2743/white?text=Instructor', linkUrl: 'https://www.instagram.com/', isActive: true },
      { id: crypto.randomUUID(), type: 'instagram', videoId: 'placeholder7', title: 'AI 도구 활용 팁', thumbnailUrl: 'https://placehold.co/400x400/8B5CF6/white?text=AI+Tips', linkUrl: 'https://www.instagram.com/', isActive: true },
      { id: crypto.randomUUID(), type: 'instagram', videoId: 'placeholder8', title: '수료식 현장', thumbnailUrl: 'https://placehold.co/400x400/EC4899/white?text=Graduation', linkUrl: 'https://www.instagram.com/', isActive: true },
    ];
    await prisma.systemSetting.create({
      data: { key: shortsGalleryKey, value: JSON.stringify(shortsData) },
    });
    console.log(`Created shorts gallery: ${shortsData.length} items`);
  } else {
    console.log('Shorts gallery already exists, skipping.');
  }

  const existingDisplay = await prisma.systemSetting.findUnique({ where: { key: shortsDisplayKey } });
  if (!existingDisplay) {
    await prisma.systemSetting.create({
      data: {
        key: shortsDisplayKey,
        value: JSON.stringify({ showOnMain: true, showOnCourseDetail: true, mainMaxItems: 6 }),
      },
    });
    console.log('Created shorts display settings.');
  }

  // 자격 소개 시드
  const qualIntrosKey = 'qualification_intros';
  const existingQualIntros = await prisma.systemSetting.findUnique({ where: { key: qualIntrosKey } });
  if (!existingQualIntros) {
    const qualIntrosData = [
      {
        id: crypto.randomUUID(),
        keywords: ['프롬프트', '엔지니어'],
        subtitle: 'AI 프롬프트 엔지니어',
        coreWork: '취업 및 AI 모델에 적합한 프롬프트 설계 및 최적화',
        roles: [
          '기업/교육기관에서 AI 활용 가이드 제작',
          '챗봇, 자동화 시스템의 대화 시나리오 설계',
          '데이터 분석 및 보고서 자동화 프롬프트 개발',
        ],
        isActive: true,
        order: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        keywords: ['교육', '지도'],
        subtitle: 'AI 교육지도사',
        coreWork: 'AI 활용 교육과 지도 및 컨설팅',
        roles: [
          '학교, 학원, 기업에서 AI 활용 교육 프로그램 운영',
          '교재·커리큘럼 개발 및 강의 진행',
          '기업 직원 AI 역량 강화 교육 및 AI 도입 컨설팅',
          '일반인 대상 AI 리터러시(활용법, 윤리, 안전) 교육',
        ],
        isActive: true,
        order: 1,
        createdAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        keywords: ['크리에이터'],
        subtitle: 'AI 크리에이터 전문가',
        coreWork: 'AI 도구를 활용한 콘텐츠 기획·제작 및 크리에이티브 업무',
        roles: [
          'AI 기반 이미지·영상·텍스트 콘텐츠 제작',
          '마케팅·브랜딩 콘텐츠 자동화 설계',
          '크리에이티브 워크플로우에 AI 도구 통합',
        ],
        isActive: true,
        order: 2,
        createdAt: new Date().toISOString(),
      },
    ];
    await prisma.systemSetting.create({
      data: { key: qualIntrosKey, value: JSON.stringify(qualIntrosData) },
    });
    console.log(`Created qualification intros: ${qualIntrosData.length} items`);
  } else {
    console.log('Qualification intros already exists, skipping.');
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
