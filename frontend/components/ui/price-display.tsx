'use client';

import { useEffect, useState } from 'react';

interface PriceDisplayProps {
  price: number;
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
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('accessToken'));
  }, []);

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

  return (
    <span className={className} style={style}>
      {price === 0 ? '무료' : `${price.toLocaleString()}원`}
    </span>
  );
}
