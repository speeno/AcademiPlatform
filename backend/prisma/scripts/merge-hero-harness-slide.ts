import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter } as any);

const HERO_SETTING_KEY = 'hero_banner';
const HARNESS_SLIDE_ID = 'default-harness-ax';

type HeroSlide = {
  id: string;
  backgroundImage: string;
  overlayOpacity: number;
  badge: string;
  title: string;
  subtitle: string;
  primaryButton: { text: string; href: string } | null;
  secondaryButton: { text: string; href: string } | null;
  promoCard: {
    image: string;
    title: string;
    description: string;
    href: string;
    ctaText: string;
  } | null;
  isActive: boolean;
};

const HARNESS_AX_HERO_SLIDE: HeroSlide = {
  id: HARNESS_SLIDE_ID,
  backgroundImage: '/covers/harness-nondev-1w.png',
  overlayOpacity: 0.62,
  badge: '기업 AX 전환 · Harness·Agent Skills',
  title: '팀 단위 **AX 전환**,\nHarness로\n실무 자동화를 설계하세요',
  subtitle:
    '비개발·개발 트랙, 1일·3일·1주 코호트.\n실시간 워크숍 중심으로 진행하고 AcademiQ는 자료·과제 허브로 보조 활용합니다.',
  primaryButton: { text: '기업 교육 프로그램', href: '/courses/harness-program' },
  secondaryButton: { text: '교육 문의', href: '/contact' },
  promoCard: {
    image: '/covers/harness-dev-3d.png',
    title: 'Harness·Agent Skills',
    description: '스킬·워크플로·검증까지 파일럿 패키지로 완성하는 기업 AX 전환 과정',
    href: '/courses/harness-program',
    ctaText: '프로그램 보기',
  },
  isActive: true,
};

const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'default-1',
    backgroundImage: '/images/promos/hero-promo-corporate.webp',
    overlayOpacity: 0.58,
    badge: '기업과 개인을 위한 실무형 AI 교육·컨설팅 플랫폼',
    title: 'AI를 배우는 것을 넘어,\n실제 **업무 성과**로\n연결하세요',
    subtitle:
      '실무 교육·AI 컨설팅·업무 자동화·자격 경로를 한 플랫폼에서.\n학습부터 현장 적용·성과 측정까지 이어지는 실무형 여정을 제공합니다.',
    primaryButton: { text: '무료 상담 신청', href: '/contact' },
    secondaryButton: { text: '교육과정 보기', href: '/courses' },
    promoCard: {
      image: '/images/promos/hero-promo-corporate.webp',
      title: '기업·개인 맞춤 실무 교육',
      description: '직무별 커리큘럼과 컨설팅으로 AI를 업무 성과로 연결합니다.',
      href: '/contact',
      ctaText: '상담 신청',
    },
    isActive: true,
  },
  {
    id: 'default-2',
    backgroundImage: '/images/promos/hero-promo-corporate.webp',
    overlayOpacity: 0.58,
    badge: '기업 맞춤 AI 실무 교육',
    title: '임직원 AI 역량,\n지금 **업그레이드**',
    subtitle: '직무별 커리큘럼 설계부터 교육 운영까지\n기업 전용 트랙으로 빠르게 도입하세요.',
    primaryButton: { text: '도입 상담하기', href: '/contact' },
    secondaryButton: null,
    promoCard: {
      image: '/images/promos/hero-promo-corporate.webp',
      title: '기업교육 B2B 프로그램',
      description: '현업 적용 중심의 팀 단위 실무 교육을 제공합니다.',
      href: '/contact',
      ctaText: '문의하기',
    },
    isActive: true,
  },
  {
    id: 'default-3',
    backgroundImage: '/images/promos/hero-promo-certification.webp',
    overlayOpacity: 0.62,
    badge: '공신력 있는 자격 경로 (ISO/IEC 17024)',
    title: '학습과 성과를\n**자격**으로\n증명하세요',
    subtitle:
      '실무 역량을 쌓은 뒤, 필요 시 ISO/IEC 17024 기반 AI 자격으로 공신력을 더할 수 있습니다.\n교육·시험 접수도 같은 플랫폼에서 이어집니다.',
    primaryButton: { text: '교육과정 보기', href: '/courses' },
    secondaryButton: { text: '자격증시험 온라인 접수', href: '/exam' },
    promoCard: {
      image: '/covers/ai-iso-creator.png',
      title: 'AI ISO Creator 과정',
      description: '실무 커리큘럼과 국제 자격 대비를 함께 준비할 수 있습니다.',
      href: '/courses/ai-expert-1',
      ctaText: '자세히 보기',
    },
    isActive: true,
  },
];

function parseHeroSlides(rawValue?: string | null): HeroSlide[] {
  if (!rawValue) return [];
  try {
    const parsed = JSON.parse(rawValue) as { slides?: HeroSlide[] };
    return Array.isArray(parsed?.slides) ? parsed.slides : [];
  } catch {
    return [];
  }
}

function mergeHarnessSlide(slides: HeroSlide[]): HeroSlide[] {
  const withoutHarness = slides.filter((slide) => slide?.id !== HARNESS_SLIDE_ID);
  const insertIndex = Math.min(1, withoutHarness.length);
  withoutHarness.splice(insertIndex, 0, HARNESS_AX_HERO_SLIDE);
  return withoutHarness;
}

async function run() {
  const existing = await prisma.systemSetting.findUnique({
    where: { key: HERO_SETTING_KEY },
    select: { id: true, value: true },
  });

  const baseSlides =
    existing && parseHeroSlides(existing.value).length > 0
      ? parseHeroSlides(existing.value)
      : DEFAULT_HERO_SLIDES;

  const mergedSlides = mergeHarnessSlide(baseSlides);
  const payload = JSON.stringify({ slides: mergedSlides });

  await prisma.systemSetting.upsert({
    where: { key: HERO_SETTING_KEY },
    create: {
      key: HERO_SETTING_KEY,
      value: payload,
    },
    update: {
      value: payload,
    },
  });

  console.log(
    `hero_banner upsert done (total slides: ${mergedSlides.length}, harness id: ${HARNESS_SLIDE_ID})`,
  );
}

run()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
