'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageLoader } from '@/components/ui/page-loader';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandBadge } from '@/components/ui/brand-badge';
import { API_BASE } from '@/lib/api-base';
import { buildAuthHeader } from '@/lib/auth';

const statusInfo: Record<string, { label: string; variant: 'default' | 'blue' | 'orange' | 'green' | 'red' }> = {
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
  formJson?: Record<string, any>;
  user: { name: string; email: string; phone: string | null } | null;
  payment: { amount: number; paymentStatus: string } | null;
}

function getApplicantName(a: Application): string {
  return a.user?.name ?? (a.formJson?.applicantName as string) ?? '(비회원)';
}

function getApplicantEmail(a: Application): string {
  return a.user?.email ?? (a.formJson?.email as string) ?? '-';
}

function getApplicantPhone(a: Application): string {
  return a.user?.phone ?? (a.formJson?.phone as string) ?? '-';
}

export default function ExamApplicationsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch(`${API_BASE}/exam/admin/sessions/${id}/applications`, { headers: buildAuthHeader(false) });
      if (res.ok) {
        const d = await res.json();
        setApps(d.applications ?? d);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleStatusChange = async (appId: string, status: string) => {
    setUpdatingId(appId);
    try {
      const res = await fetch(`${API_BASE}/exam/admin/applications/${appId}/status`, {
        method: 'PATCH', headers: buildAuthHeader(), body: JSON.stringify({ status }),
      });
      if (res.ok) setApps((p) => p.map((a) => a.id === appId ? { ...a, status } : a));
    } catch { /* ignore */ } finally { setUpdatingId(null); }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <BrandButton variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-1" /> 뒤로
        </BrandButton>
        <div>
          <h1 className="text-heading text-brand-blue">접수자 목록</h1>
          <p className="text-sm text-muted-foreground mt-1">총 {apps.length}명 접수</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 border-b">
            <tr>{['이름', '이메일', '연락처', '소속/직업', '권유자', '접수일', '상태', '관리'].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y">
            {apps.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">접수자가 없습니다.</td></tr>
            ) : apps.map((a) => {
              const si = statusInfo[a.status] ?? { label: a.status, variant: 'default' as const };
              return (
                <tr key={a.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{getApplicantName(a)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{getApplicantEmail(a)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{getApplicantPhone(a)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{(a.formJson?.occupation as string) || '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{a.referrerCode || '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(a.appliedAt).toLocaleDateString('ko-KR')}</td>
                  <td className="px-4 py-3"><BrandBadge variant={si.variant} className="text-xs">{si.label}</BrandBadge></td>
                  <td className="px-4 py-3">
                    <select
                      value={a.status}
                      disabled={updatingId === a.id}
                      onChange={(e) => handleStatusChange(a.id, e.target.value)}
                      className="text-xs border rounded px-2 py-1 bg-white"
                    >
                      {Object.entries(statusInfo).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
