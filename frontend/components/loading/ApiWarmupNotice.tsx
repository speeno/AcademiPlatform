'use client';

import { Loader2 } from 'lucide-react';

type ApiWarmupNoticeProps = {
  elapsedSeconds: number;
  className?: string;
};

export function ApiWarmupNotice({ elapsedSeconds, className }: ApiWarmupNoticeProps) {
  return (
    <div className={className ?? 'text-center py-20 text-muted-foreground'}>
      <Loader2 className="w-12 h-12 mx-auto mb-3 animate-spin text-brand-blue opacity-70" />
      <p className="text-foreground font-medium">무료 서버를 준비 중입니다.</p>
      <p className="text-sm mt-2 max-w-md mx-auto">
        첫 접속 시 <span className="font-semibold text-foreground">최대 약 50초</span> 걸릴 수 있습니다.
        잠시만 기다려 주세요.
      </p>
      {elapsedSeconds > 0 && (
        <p className="text-xs mt-3 text-muted-foreground">경과 {elapsedSeconds}초…</p>
      )}
    </div>
  );
}
