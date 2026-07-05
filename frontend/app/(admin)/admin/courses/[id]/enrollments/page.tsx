'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import { API_BASE } from '@/lib/api-base';
import { buildAuthHeader } from '@/lib/auth';
import { BrandButton } from '@/components/ui/brand-button';

type EnrollmentItem = {
  id: string;
  userId: string;
  status: string;
  enrolledAt: string;
  progressRate: number;
  user?: { id: string; name: string; email: string; phone?: string | null };
};

export default function AdminCourseEnrollmentsPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const authHeader = useMemo(() => buildAuthHeader(), []);
  const [items, setItems] = useState<EnrollmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/courses/admin/${courseId}/enrollments`, {
        headers: buildAuthHeader(false),
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    if (!targetUserId.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`${API_BASE}/courses/admin/${courseId}/enrollments`, {
        method: 'POST',
        headers: authHeader,
        credentials: 'include',
        body: JSON.stringify({ userId: targetUserId.trim() }),
      });
      if (res.ok) {
        setTargetUserId('');
        await load();
      }
    } finally {
      setAdding(false);
    }
  };

  const [deciding, setDeciding] = useState<string>('');
  const decide = async (enrollmentId: string, action: 'approve' | 'reject') => {
    if (action === 'reject' && !confirm('이 수강 신청을 거절하시겠습니까?')) return;
    setDeciding(enrollmentId);
    try {
      const res = await fetch(
        `${API_BASE}/courses/admin/${courseId}/enrollments/${enrollmentId}/${action}`,
        { method: 'POST', headers: authHeader, credentials: 'include' },
      );
      if (res.ok) await load();
    } finally {
      setDeciding('');
    }
  };

  const STATUS_META: Record<string, { label: string; cls: string }> = {
    PENDING: { label: '승인 대기', cls: 'bg-amber-100 text-amber-700' },
    ACTIVE: { label: '수강중', cls: 'bg-green-100 text-green-700' },
    EXPIRED: { label: '만료', cls: 'bg-gray-100 text-gray-600' },
    CANCELLED: { label: '거절/취소', cls: 'bg-red-100 text-red-600' },
    REFUNDED: { label: '환불', cls: 'bg-gray-100 text-gray-600' },
  };

  const sortedItems = [...items].sort((a, b) => {
    const rank = (s: string) => (s === 'PENDING' ? 0 : s === 'ACTIVE' ? 1 : 2);
    return rank(a.status) - rank(b.status);
  });
  const pendingCount = items.filter((i) => i.status === 'PENDING').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading text-brand-blue">수강 신청 승인 / 수강생 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">
            수강 신청(승인 대기)을 승인하면 수강이 시작됩니다.
            {pendingCount > 0 && (
              <span className="ml-1 font-semibold text-amber-600">· 대기 {pendingCount}건</span>
            )}
          </p>
        </div>
        <Link href={`/admin/courses/${courseId}`}>
          <BrandButton variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            강좌 편집
          </BrandButton>
        </Link>
      </div>

      <section className="rounded-xl border bg-white p-4">
        <div className="grid md:grid-cols-[1fr_auto] gap-2">
          <input
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            placeholder="등록할 userId"
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <BrandButton variant="primary" size="sm" loading={adding} onClick={add}>
            <Plus className="w-4 h-4 mr-1" />
            수동 등록
          </BrandButton>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : sortedItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">수강 신청/수강생이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {sortedItems.map((item) => {
              const meta = STATUS_META[item.status] ?? { label: item.status, cls: 'bg-gray-100 text-gray-600' };
              const isPending = item.status === 'PENDING';
              return (
                <div key={item.id} className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${meta.cls}`}>{meta.label}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.user?.name ?? '-'} ({item.user?.email ?? item.userId})</p>
                    <p className="text-xs text-muted-foreground">
                      진도: {Math.round(item.progressRate ?? 0)}% · 신청일: {new Date(item.enrolledAt).toLocaleString('ko-KR')}
                    </p>
                  </div>
                  {isPending && (
                    <div className="flex shrink-0 gap-2">
                      <BrandButton variant="primary" size="sm" loading={deciding === item.id} onClick={() => decide(item.id, 'approve')}>
                        승인
                      </BrandButton>
                      <BrandButton variant="outline" size="sm" disabled={deciding === item.id} onClick={() => decide(item.id, 'reject')}>
                        거절
                      </BrandButton>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
