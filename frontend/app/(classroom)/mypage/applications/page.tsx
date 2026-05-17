'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList, Loader2, XCircle } from 'lucide-react';
import { BrandBadge } from '@/components/ui/brand-badge';
import { BrandButton } from '@/components/ui/brand-button';
import { ApplicationDepositSummary } from '@/components/exam/ApplicationDepositSummary';
import { apiFetchWithAuth, getAccessToken } from '@/lib/api-client';
import type { DepositAccountInfo } from '@/lib/referrer';

const statusLabel: Record<string, { label: string; variant: 'default' | 'blue' | 'orange' | 'green' | 'red' }> = {
  TEMP_SAVED:       { label: '임시 저장', variant: 'default' },
  PAYMENT_PENDING:  { label: '결제 대기', variant: 'orange' },
  APPLIED:          { label: '접수 완료', variant: 'green' },
  CANCELLED:        { label: '취소됨', variant: 'red' },
  REFUND_REQUESTED: { label: '환불 요청', variant: 'orange' },
  REFUNDED:         { label: '환불 완료', variant: 'default' },
};

interface Application {
  id: string;
  status: string;
  appliedAt: string;
  referrerCode?: string | null;
  depositAccount?: DepositAccountInfo;
  examSession?: {
    qualificationName: string;
    roundName: string;
    examAt: string;
    place: string | null;
    fee: number;
  } | null;
}

export default function ApplicationsPage() {
  const router = useRouter();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    const fetch_ = async () => {
      if (!getAccessToken()) {
        router.push('/login');
        return;
      }
      try {
        const res = await apiFetchWithAuth('/exam/my/applications');
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        if (!res.ok) {
          setApps([]);
          return;
        }
        const data = await res.json();
        setApps(Array.isArray(data) ? data : []);
      } catch {
        setApps([]);
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [router]);

  const handleCancel = async (id: string) => {
    if (!confirm('시험 접수를 취소하시겠습니까?')) return;
    setCancellingId(id);
    try {
      const res = await apiFetchWithAuth(`/exam/my/applications/${id}/cancel`, {
        method: 'POST',
      });
      if (res.ok) setApps((prev) => prev.map((a) => a.id === id ? { ...a, status: 'CANCELLED' } : a));
      else alert('취소에 실패했습니다.');
    } catch { alert('네트워크 오류가 발생했습니다.'); }
    finally { setCancellingId(null); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--brand-blue)' }} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--brand-blue)' }}>시험 신청 내역</h1>
        <p className="text-sm text-gray-500 mt-1">접수한 시험 일정을 확인하세요.</p>
      </div>

      {apps.length === 0 ? (
        <div className="text-center py-20">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">접수한 시험이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {apps.map((app) => {
            const s = statusLabel[app.status] ?? { label: app.status, variant: 'default' as const };
            return (
              <div key={app.id} className="bg-white rounded-xl border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <BrandBadge variant={s.variant}>{s.label}</BrandBadge>
                    </div>
                    <h3 className="font-bold text-gray-900">{app.examSession?.qualificationName ?? '시험'}</h3>
                    <p className="text-sm text-gray-500 mt-1">{app.examSession?.roundName ?? ''}</p>
                    <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-500">
                      <span>시험일: {app.examSession?.examAt ? new Date(app.examSession.examAt).toLocaleDateString('ko-KR') : '-'}</span>
                      {app.examSession?.place && <span>장소: {app.examSession.place}</span>}
                      <span>응시료: {Number(app.examSession?.fee ?? 0).toLocaleString()}원</span>
                      <span>접수일: {new Date(app.appliedAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                    {app.depositAccount && (
                      <ApplicationDepositSummary account={app.depositAccount} />
                    )}
                  </div>
                  {app.status === 'APPLIED' && (
                    <BrandButton
                      variant="danger"
                      size="sm"
                      loading={cancellingId === app.id}
                      onClick={() => handleCancel(app.id)}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" /> 취소
                    </BrandButton>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
