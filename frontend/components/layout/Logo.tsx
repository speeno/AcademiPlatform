import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/* ── Logo (Navbar, 사이드바) ──────────────────────────────── */
interface LogoProps {
  variant?: 'full' | 'wordmark' | 'symbol';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  href?: string;
}

const sizeMap = {
  sm: { width: 161, height: 30 },
  md: { width: 268, height: 60 },
  lg: { width: 269, height: 50 },
};

export function Logo({
  variant = 'wordmark',
  size = 'md',
  className,
  href = '/',
}: LogoProps) {
  const { width, height } = sizeMap[size];
  const src = variant === 'symbol' ? '/logo/logo-mark-v3.png' : '/logo/logo-main-v4.png';
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
      <Link href={href} className="inline-flex items-center hover:opacity-90 transition-opacity">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}

/* ── LogoHorizontal (Footer, Auth 레이아웃) ──────────────── */
export function LogoHorizontal({
  className,
  height = 45,
  showSlogan = true,
}: {
  className?: string;
  height?: number;
  showSlogan?: boolean;
}) {
  const width = Math.round((1024 / 288) * height);

  return (
    <Image
      src="/logo/logo-horizontal-v3.png"
      alt={showSlogan ? 'AcademiQ AI & Certification Training' : 'AcademiQ'}
      width={width}
      height={height}
      className={cn('object-contain shrink-0', className)}
      style={{ width: `${width}px`, height: `${height}px` }}
      unoptimized
    />
  );
}

/* ── LogoFull (세로형 — 특수 용도) ─────────────────────────── */
export function LogoFull({ className }: { className?: string }) {
  return (
    <Image
      src="/logo/logo-main-v4.png"
      alt="AcademiQ AI & Certification Training"
      width={1024}
      height={288}
      className={cn('object-contain w-auto', className)}
      unoptimized
      priority
    />
  );
}
