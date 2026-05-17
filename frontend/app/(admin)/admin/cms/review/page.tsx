'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { API_BASE } from '@/lib/api-base';
import { buildAuthHeader } from '@/lib/auth';
import { BrandButton } from '@/components/ui/brand-button';
import { toast } from 'sonner';

interface ReviewItem {
  id: string;
  createdAt: string;
  item: {
    id: string;
    contentType: string;
    lesson: { id: string; title: string };
    course: { id: string; title: string; slug: string };
  };
  version?: { versionNo: number; changeNote?: string; schemaJson: Record<string, unknown> } | null;
  requestedBy: { id: string; name: string; email: string };
}

export default function CmsReviewPage() {
  const [queue, setQueue] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectReasonMap, setRejectReasonMap] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/cms/review-queue`, {
        headers: buildAuthHeader(false),
        credentials: 'include',
      });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error('검수 요청 목록을 불러오지 못했습니다.');
      setQueue(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '검수 목록 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (requestId: string) => {
    const res = await fetch(`${API_BASE}/cms/review/${requestId}/approve`, {
      method: 'POST',
      headers: buildAuthHeader(false),
      credentials: 'include',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message ?? '승인 실패');
    toast.success('게시 승인되었습니다.');
    await load();
  };

  const reject = async (requestId: string) => {
    const reason = rejectReasonMap[requestId] || '반려';
    const res = await fetch(`${API_BASE}/cms/review/${requestId}/reject`, {
      method: 'POST',
      headers: buildAuthHeader(),
      credentials: 'include',
      body: JSON.stringify({ status: 'REJECTED', rejectReason: reason }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message ?? '반려 실패');
    toast.success('반려 처리되었습니다.');
    await load();
  };

  const rollback = async (lessonId: string, versionNo: number) => {
    const res = await fetch(`${API_BASE}/cms/lessons/${lessonId}/rollback?versionNo=${versionNo}`, {
      method: 'POST',
      headers: buildAuthHeader(false),
      credentials: 'include',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message ?? '롤백 실패');
    toast.success(`버전 ${versionNo}로 롤백되었습니다.`);
    await load();
  };

  if (loading) return <div className="text-sm text-muted-foreground">불러오는 중...</div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-heading text-brand-blue">CMS 승인함</h1>
        <p className="text-sm text-muted-foreground mt-1">강사 검수요청 승인/반려 및 버전 롤백</p>
      </div>

      {queue.length === 0 ? (
        <div className="bg-white border rounded-xl p-6 text-sm text-muted-foreground">대기 중인 검수 요청이 없습니다.</div>
      ) : (
        <div className="space-y-3">
          {queue.map((item) => (
            <div key={item.id} className="bg-white border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{item.item.course.title} / {item.item.lesson.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    요청자: {item.requestedBy.name} ({item.requestedBy.email}) | 타입: {item.item.contentType} | 버전: {item.version?.versionNo ?? '-'}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString('ko-KR')}</p>
              </div>

              <div className="border rounded-lg p-3 bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground mb-2">변경 메모</p>
                <p className="text-sm text-foreground">{item.version?.changeNote || '-'}</p>
                <p className="text-xs font-semibold text-muted-foreground mt-3 mb-1">스키마 미리보기</p>
                <pre className="text-xs text-foreground whitespace-pre-wrap break-words">{JSON.stringify(item.version?.schemaJson ?? {}, null, 2)}</pre>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <input
                  className="border rounded-lg px-3 py-2 text-sm min-w-80"
                  placeholder="반려 사유 입력"
                  value={rejectReasonMap[item.id] ?? ''}
                  onChange={(e) => setRejectReasonMap((prev) => ({ ...prev, [item.id]: e.target.value }))}
                />
                <BrandButton size="sm" onClick={() => approve(item.id).catch((err: unknown) => toast.error(err instanceof Error ? err.message : '승인 실패'))}>
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  승인
                </BrandButton>
                <BrandButton size="sm" variant="outline" onClick={() => reject(item.id).catch((err: unknown) => toast.error(err instanceof Error ? err.message : '반려 실패'))}>
                  <XCircle className="w-4 h-4 mr-1" />
                  반려
                </BrandButton>
                {item.version?.versionNo ? (
                  <BrandButton size="sm" variant="outline" onClick={() => rollback(item.item.lesson.id, item.version!.versionNo).catch((err: unknown) => toast.error(err instanceof Error ? err.message : '롤백 실패'))}>
                    <RotateCcw className="w-4 h-4 mr-1" />
                    이 버전으로 롤백
                  </BrandButton>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
