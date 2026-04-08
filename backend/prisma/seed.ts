import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('Seeding database...');

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
