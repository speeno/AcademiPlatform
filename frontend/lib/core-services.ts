export type CoreServiceAccent = 'blue' | 'orange' | 'sky' | 'green';

export type CoreServiceCard = {
  title: string;
  desc: string;
  href: string;
  accent: CoreServiceAccent;
};

/** 메인·서비스 페이지 공통 핵심 서비스 카드 (순서 = 노출 순서) */
export const coreServiceCards: CoreServiceCard[] = [
  {
    title: 'ISO/IEC 17024 AI 국제자격증',
    desc: '국제 표준 기반 AI 개인 자격 인증 체계. 자격증 교육·시험 접수·자격 경로를 AcademiQ에서 연결합니다.',
    href: '/about/qualification',
    accent: 'orange',
  },
  {
    title: 'Harness 기업 교육',
    desc: '기업 AX 전환·실무 자동화 워크숍 프로그램. ISO/IEC 17024 자격 교육과정과는 별도로 운영됩니다.',
    href: '/courses/harness-program',
    accent: 'blue',
  },
  {
    title: '기업 교육',
    desc: '직무별 맞춤 커리큘럼과 B2B 운영. 팀 단위 실무 역량을 빠르게 올립니다.',
    href: '/services/corporate',
    accent: 'blue',
  },
  {
    title: '개인·실무 교육',
    desc: '온라인·라이브 강의로 AI 활용 역량을 키우고, 업무에 바로 적용합니다.',
    href: '/courses',
    accent: 'orange',
  },
  {
    title: 'AI 컨설팅·도입',
    desc: '진단·설계·실행까지. 조직에 맞는 AI 도입과 업무 자동화를 지원합니다.',
    href: '/services/consulting',
    accent: 'sky',
  },
  {
    title: '라이브·콘텐츠',
    desc: '설명회·라이브 세션과 AI Tip 영상으로 최신 실무 인사이트를 제공합니다.',
    href: '/live',
    accent: 'green',
  },
  {
    title: 'AI 홈페이지',
    desc: 'AI 기반 홈페이지 제작·운영 상담. 브랜드에 맞는 웹사이트를 설계합니다.',
    href: '/services/ai-website',
    accent: 'blue',
  },
  {
    title: '영상 제작 상담',
    desc: '홍보·교육·마케팅 영상 기획부터 제작까지, 목적에 맞는 영상을 상담합니다.',
    href: '/services/video-production',
    accent: 'orange',
  },
];
