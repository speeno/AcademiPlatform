import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * AcademiQ 브랜드 로고.
 *
 * 보류 (Deferred): Connected Q 리파인 — 브랜드 SVG 에셋 작업 선행 필요.
 * 진행 절차는 `frontend/docs/design-system.md` §7-1 참조.
 * 에셋 교체 시 본 파일에서는 각 컴포넌트의 `src` 경로(`/logo/logo-*.png`)
 * 와 `sizeMap` 종횡비만 조정하면 되며, 사용처(Navbar/Footer/Auth)는
 * 그대로 유지된다.
 */

/* ── Logo (Navbar, 사이드바) ──────────────────────────────── */
interface LogoProps {
  variant?: 'full' | 'wordmark' | 'symbol';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  href?: string;
  onClick?: () => void;
}

const sizeMap = {
  xs: { width: 155, height: 37 },
  sm: { width: 173, height: 41 },
  md: { width: 210, height: 50 },
  lg: { width: 245, height: 59 },
};

export function Logo({
  variant = 'wordmark',
  size = 'md',
  className,
  href = '/',
  onClick,
}: LogoProps) {
  const { width, height } = sizeMap[size];
  const src = variant === 'symbol' ? '/logo/logo-mark-v4.png' : '/logo/logo-main-v5.png';
  const imgWidth = variant === 'symbol' ? Math.round(height * 0.9) : width;

  const logoContent = (
    <Image
      src={src}
      alt="AcademiQ 로고"
      width={imgWidth}
      height={height}
      className={cn('object-contain', className)}
      style={{ width: `${imgWidth}px`, height: `${height}px` }}
      unoptimized
      priority
    />
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className="inline-flex items-center hover:opacity-90 transition-opacity"
      >
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}

/* ── LogoHorizontal (Footer, Auth 레이아웃) ──────────────── */
export function LogoHorizontal({
  className,
  height = 52,
  showSlogan = true,
  fluid = false,
}: {
  className?: string;
  height?: number;
  showSlogan?: boolean;
  /** 사이드바 등 좁은 영역 — 컨테이너 너비에 맞춰 비율 유지 */
  fluid?: boolean;
}) {
  const ratio = 930 / 221;
  const width = Math.round(ratio * height);

  return (
    <Image
      src={showSlogan ? '/logo/logo-horizontal-v4.png' : '/logo/logo-main-v5.png'}
      alt={showSlogan ? 'AcademiQ AI & Certification Training' : 'AcademiQ'}
      width={width}
      height={height}
      className={cn('object-contain shrink-0', fluid && 'h-auto w-full max-w-full', className)}
      style={fluid ? undefined : { width: `${width}px`, height: `${height}px` }}
      unoptimized
    />
  );
}

/* ── LogoFull (세로형 — 특수 용도) ─────────────────────────── */
export function LogoFull({ className }: { className?: string }) {
  return (
    <Image
      src="/logo/logo-main-v5.png"
      alt="AcademiQ AI & Certification Training"
      width={1024}
      height={288}
      className={cn('object-contain w-auto', className)}
      unoptimized
      priority
    />
  );
}
