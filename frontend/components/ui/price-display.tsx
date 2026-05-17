'use client';

import { useAuthState } from '@/lib/use-auth-state';

interface PriceDisplayProps {
  price: number | null | undefined;
  className?: string;
  style?: React.CSSProperties;
  loginMessage?: string;
}

export function PriceDisplay({
  price,
  className,
  style,
  loginMessage = '로그인 후 확인',
}: PriceDisplayProps) {
  const isLoggedIn = useAuthState();

  if (isLoggedIn === null) {
    return (
      <span className={className} style={style}>
        &nbsp;
      </span>
    );
  }

  if (!isLoggedIn) {
    return (
      <span className={className} style={{ ...style, fontSize: style?.fontSize ?? 'inherit' }}>
        {loginMessage}
      </span>
    );
  }

  if (price == null) {
    return (
      <span className={className} style={style}>
        —
      </span>
    );
  }

  return (
    <span className={className} style={style}>
      {price === 0 ? '무료' : `${price.toLocaleString()}원`}
    </span>
  );
}
