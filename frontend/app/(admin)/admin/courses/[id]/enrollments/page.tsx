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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading text-brand-blue">수동 수강 등록</h1>
          <p className="text-sm text-muted-foreground mt-1">B2B 명단 기준으로 사용자 ID를 입력해 수강을 부여합니다.</p>
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
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">등록된 수강생이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="rounded-lg border px-3 py-2 text-sm">
                <p className="font-medium">{item.user?.name ?? '-'} ({item.user?.email ?? item.userId})</p>
                <p className="text-xs text-muted-foreground mt-1">
                  상태: {item.status} · 진도: {Math.round(item.progressRate ?? 0)}% · 등록일: {new Date(item.enrolledAt).toLocaleString('ko-KR')}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
