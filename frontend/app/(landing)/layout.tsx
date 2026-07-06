import Image from 'next/image';

/**
 * 독립 랜딩(마케팅) 레이아웃.
 * 사이트 상단 네비게이션·푸터·챗봇 등 사이트 크롬을 렌더하지 않아, 이메일로 공유한
 * 단일 페이지가 독립 페이지처럼 보이도록 한다. 상단 로고는 링크가 아니며 푸터에도
 * 외부로 나가는 링크를 두지 않는다.
 */
export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-5 md:px-8">
          <Image
            src="/logo/logo-main-v5.png"
            alt="AcademiQ"
            width={173}
            height={41}
            unoptimized
            priority
            className="h-8 w-auto object-contain sm:h-9"
          />
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
              공동교육
            </span>
            <Image
              src="/logo/partner-ddpa.jpg"
              alt="한국디지털플랫폼협회 (DDPA)"
              width={436}
              height={77}
              unoptimized
              priority
              className="h-6 w-auto object-contain sm:h-7"
            />
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-white py-8">
        <div className="mx-auto max-w-[1180px] px-5 text-center md:px-8">
          <div className="mb-5 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Image
              src="/logo/logo-main-v5.png"
              alt="AcademiQ"
              width={173}
              height={41}
              unoptimized
              className="h-7 w-auto object-contain sm:h-8"
            />
            <span className="h-6 w-px bg-border" aria-hidden />
            <Image
              src="/logo/partner-ddpa.jpg"
              alt="한국디지털플랫폼협회 (DDPA)"
              width={436}
              height={77}
              unoptimized
              className="h-6 w-auto object-contain sm:h-7"
            />
          </div>
          <p className="text-sm font-semibold text-brand-blue">
            AcademiQ · AX 워크톤
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            ISO/IEC 17024 기반 AI 자격 교육 · 기업 AX 실전 교육
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            공동교육&nbsp;·&nbsp;한국디지털플랫폼협회(DDPA)
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            © 2026 AcademiQ · 한국디지털플랫폼협회. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}
