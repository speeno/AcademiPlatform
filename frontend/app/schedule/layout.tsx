import Image from 'next/image';

const ASSOCIATION_SITE_URL = 'http://www.ddpa.or.kr/';
const ACADEMIQ_SITE_URL = 'https://academiq.life';

/**
 * 게시용 교육 일정 영역(/schedule/*) 공통 레이아웃.
 * 사이트 네비게이션 없이 협회·AcademiQ 로고 헤더와 안내 푸터만 두어,
 * 미니 달력 → 확대 달력(과정 상세)까지 격리된 흐름으로 이동한다.
 */
export default function ScheduleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-5 md:px-8">
          {/* 좌: 협회 로고 / 우: AcademiQ 로고 */}
          <Image
            src="/logo/partner-ddpa.jpg"
            alt="한국디지털문서플랫폼협회 (Korea Digital Document Platform Association)"
            width={436}
            height={77}
            unoptimized
            priority
            className="h-8 w-auto object-contain sm:h-10"
          />
          <Image
            src="/logo/logo-main-v5.png"
            alt="AcademiQ"
            width={173}
            height={41}
            unoptimized
            priority
            className="h-7 w-auto object-contain sm:h-8"
          />
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-white py-8">
        <div className="mx-auto max-w-[1180px] px-5 text-center md:px-8">
          <p className="text-xs text-muted-foreground">
            본 페이지는 교육 일정 안내를 위한 게시용 페이지입니다. 일정을 선택하면 과정별
            상세 안내로 이동합니다.
          </p>
          <p className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
            <a
              href={ASSOCIATION_SITE_URL}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-brand-blue hover:underline"
            >
              한국디지털문서플랫폼협회 홈페이지
            </a>
            <span className="h-3 w-px bg-border" aria-hidden />
            <a
              href={ACADEMIQ_SITE_URL}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-brand-blue hover:underline"
            >
              AcademiQ 홈페이지
            </a>
            <span className="h-3 w-px bg-border" aria-hidden />
            {/* 일정 등록(교육 운영) 담당자용 수업관리 로그인 */}
            <a
              href="/training/login?next=%2Ftraining"
              className="text-muted-foreground hover:text-foreground hover:underline"
            >
              일정 등록 관리자 로그인
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
