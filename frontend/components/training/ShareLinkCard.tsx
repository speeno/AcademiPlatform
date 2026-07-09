'use client';

import { useState } from 'react';
import { Copy, ExternalLink, Link2, Link2Off } from 'lucide-react';
import { toast } from 'sonner';
import { BrandButton } from '@/components/ui/brand-button';
import { apiFetchWithAuth, parseJsonSafe } from '@/lib/api-client';

interface ShareLinkCardProps {
  programId: string;
  shareToken?: string | null;
  onChanged: () => void;
}

/** 강의 계획 게시용(보기 전용) 공유 링크 발급/복사/해제 카드 */
export function ShareLinkCard({ programId, shareToken, onChanged }: ShareLinkCardProps) {
  const [working, setWorking] = useState(false);

  const shareUrl = shareToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/training-plan/${shareToken}`
    : null;

  const handleEnable = async () => {
    setWorking(true);
    try {
      const res = await apiFetchWithAuth(`/training/programs/${programId}/share`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await parseJsonSafe<{ message?: string }>(res, {});
        throw new Error(data.message ?? '공유 링크 발급에 실패했습니다.');
      }
      toast.success('게시용 공유 링크가 발급되었습니다.');
      onChanged();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setWorking(false);
    }
  };

  const handleDisable = async () => {
    if (!confirm('공유를 해제할까요?\n기존에 게시한 링크는 즉시 접근할 수 없게 됩니다.')) return;
    setWorking(true);
    try {
      const res = await apiFetchWithAuth(`/training/programs/${programId}/share`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await parseJsonSafe<{ message?: string }>(res, {});
        throw new Error(data.message ?? '공유 해제에 실패했습니다.');
      }
      toast.success('공유가 해제되었습니다.');
      onChanged();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setWorking(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('링크가 복사되었습니다.');
    } catch {
      toast.error('복사에 실패했습니다. 주소를 직접 선택해 복사해주세요.');
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-1 flex items-center gap-2">
        <Link2 className="h-4 w-4 text-brand-blue" />
        <h3 className="text-sm font-semibold text-foreground">게시용 공유 링크</h3>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        강의 계획(기간·회차 일정)만 보기 전용으로 노출되는 링크입니다. 홈페이지·공지 등에
        게시할 수 있으며, 공유 중에는 메인 페이지 교육 일정에도 표시됩니다. 수강생 명단 등
        내부 정보는 노출되지 않습니다.
      </p>

      {shareUrl ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              onFocus={(e) => e.target.select()}
              className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 font-mono text-xs"
            />
            <BrandButton variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="h-3.5 w-3.5" /> 복사
            </BrandButton>
          </div>
          <div className="flex gap-2">
            <a href={shareUrl} target="_blank" rel="noreferrer">
              <BrandButton variant="ghost" size="sm">
                <ExternalLink className="h-3.5 w-3.5" /> 미리보기
              </BrandButton>
            </a>
            <BrandButton
              variant="ghost"
              size="sm"
              loading={working}
              onClick={handleDisable}
              className="text-red-600"
            >
              <Link2Off className="h-3.5 w-3.5" /> 공유 해제
            </BrandButton>
          </div>
        </div>
      ) : (
        <BrandButton variant="outline" size="sm" loading={working} onClick={handleEnable}>
          <Link2 className="h-3.5 w-3.5" /> 공유 링크 발급
        </BrandButton>
      )}
    </div>
  );
}
