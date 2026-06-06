/** 공개 사이트 상단 네비게이션 (Navbar·문서 동기화용) */
export const publicNavItems = [
  { label: '서비스', href: '/services' },
  { label: '국제자격증소개', href: '/about' },
  { label: '자격증교육과정', href: '/courses' },
  { label: '시험접수', href: '/exam' },
  { label: '교재 구매', href: '/store/textbooks' },
  { label: '라이브/설명회', href: '/live' },
  { label: 'AI Tip 영상', href: '/shorts' },
  { label: '공지사항', href: '/notices' },
  { label: 'FAQ', href: '/faq' },
] as const;

export const publicNavLinkClass =
  'group relative shrink-0 whitespace-nowrap rounded-md px-2 py-2 text-xs font-bold text-muted-foreground transition-colors hover:text-brand-blue xl:px-3 xl:text-sm';

export const publicNavMobileLinkClass =
  'block min-h-12 px-3 py-3 text-sm font-bold text-muted-foreground hover:text-brand-blue rounded-md hover:bg-brand-blue-subtle';
