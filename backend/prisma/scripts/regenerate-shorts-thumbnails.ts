/**
 * shorts_gallery 내 YouTube 항목 썸네일·링크를 고해상도 URL로 일괄 갱신.
 * 운영 DB는 관리자 화면 「썸네일 일괄 재생성」 또는 POST /admin/shorts-gallery/regenerate-thumbnails 사용.
 *
 * Usage (로컬만):
 *   npm run shorts:thumbnails:regenerate
 *   npm run shorts:thumbnails:regenerate -- --dry-run
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import {
  regenerateShortsGalleryItems,
  type ShortsGalleryItem,
} from '../../src/lib/youtube-shorts';

dotenv.config();

const SHORTS_GALLERY_KEY = 'shorts_gallery';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  const setting = await prisma.systemSetting.findUnique({
    where: { key: SHORTS_GALLERY_KEY },
  });

  if (!setting?.value) {
    console.log('shorts_gallery 설정이 없습니다.');
    return;
  }

  let items: ShortsGalleryItem[];
  try {
    const parsed = JSON.parse(setting.value);
    if (!Array.isArray(parsed)) {
      console.error('shorts_gallery 값이 배열이 아닙니다.');
      process.exit(1);
    }
    items = parsed;
  } catch {
    console.error('shorts_gallery JSON 파싱 실패');
    process.exit(1);
  }

  const { items: next, updated } = regenerateShortsGalleryItems(items);

  if (updated > 0) {
    for (const item of next) {
      const prev = items.find((i) => i.id === item.id);
      const before = (prev?.thumbnailUrl ?? '').trim();
      const after = (item.thumbnailUrl ?? '').trim();
      if (before !== after) {
        console.log(`[${dryRun ? 'dry-run' : 'update'}] ${item.title || item.id}: thumb → ${after}`);
      }
    }
  }

  console.log(`총 ${items.length}건 중 YouTube 썸네일·링크 갱신 대상: ${updated}건`);

  if (dryRun) {
    console.log('(--dry-run) DB는 변경하지 않았습니다.');
    return;
  }

  if (updated === 0) {
    console.log('변경 사항 없음.');
    return;
  }

  await prisma.systemSetting.update({
    where: { key: SHORTS_GALLERY_KEY },
    data: { value: JSON.stringify(next) },
  });

  console.log('shorts_gallery 저장 완료.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
