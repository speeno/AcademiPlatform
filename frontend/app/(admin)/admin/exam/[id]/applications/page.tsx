'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageLoader } from '@/components/ui/page-loader';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandBadge } from '@/components/ui/brand-badge';
import { API_BASE } from '@/lib/api-base';
import { buildAuthHeader } from '@/lib/auth';
import { parseJsonSafe } from '@/lib/api-client';

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
  hasIdPhoto?: boolean;
  idPhotoFileName?: string | null;
  examEligibility?: string;
  attempt?: {
    id: string;
    status: string;
    startedAt?: string | null;
    submittedAt?: string | null;
    warningCount?: number;
    result?: {
      status: string;
      totalScore: number;
      maxScore: number;
      publishedAt?: string | null;
    } | null;
  } | null;
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

function isOnlineApplicant(a: Application): boolean {
  const selectedMode = typeof a.formJson?.examMode === 'string'
    ? a.formJson.examMode.toUpperCase()
    : '';
  return selectedMode !== 'OFFLINE';
}

function getOnlineSubmissionDisplay(a: Application): {
  label: string;
  variant: 'default' | 'blue' | 'orange' | 'green' | 'red';
  detail?: string;
} {
  if (!isOnlineApplicant(a)) {
    return { label: '오프라인', variant: 'default' };
  }

  const attempt = a.attempt;
  if (!attempt) {
    return { label: '미응시', variant: 'default' };
  }

  if (attempt.status === 'IN_PROGRESS') {
    return { label: '응시 중', variant: 'orange' };
  }

  if (attempt.status === 'INVALIDATED') {
    return {
      label: '무효 처리',
      variant: 'red',
      detail: attempt.submittedAt
        ? `제출 ${new Date(attempt.submittedAt).toLocaleString('ko-KR')}`
        : undefined,
    };
  }

  const submittedLabel = attempt.submittedAt
    ? new Date(attempt.submittedAt).toLocaleString('ko-KR')
    : undefined;
  const gradingLabel =
    attempt.status === 'MANUAL_GRADING'
      ? '채점 대기'
      : attempt.status === 'GRADED' && attempt.result?.publishedAt
        ? `결과 공개 (${attempt.result.totalScore}/${attempt.result.maxScore})`
        : attempt.status === 'GRADED' || attempt.status === 'AUTO_GRADED'
          ? '채점 완료'
          : undefined;

  return {
    label: '답안 제출 완료',
    variant: 'green',
    detail: [submittedLabel, gradingLabel, attempt.warningCount ? `경고 ${attempt.warningCount}` : null]
      .filter(Boolean)
      .join(' · '),
  };
}

export default function ExamApplicationsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch(`${API_BASE}/exam/admin/sessions/${id}/applications`, { headers: buildAuthHeader(false) });
      if (res.ok) {
        const d = await parseJsonSafe<any>(res, []);
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

  const handleEligibilityChange = async (appId: string, eligibility: string) => {
    setUpdatingId(appId);
    try {
      const res = await fetch(`${API_BASE}/online-exam/admin/applications/${appId}/eligibility`, {
        method: 'PATCH',
        headers: buildAuthHeader(),
        body: JSON.stringify({ eligibility }),
      });
      if (res.ok) {
        setApps((p) => p.map((a) => a.id === appId ? { ...a, examEligibility: eligibility } : a));
      }
    } catch { /* ignore */ } finally { setUpdatingId(null); }
  };

  const handleDownloadIdPhoto = async (app: Application) => {
    setDownloadingId(app.id);
    try {
      const res = await fetch(`${API_BASE}/exam/admin/applications/${app.id}/id-photo`, {
        headers: buildAuthHeader(false),
      });
      if (!res.ok) throw new Error('증명사진 다운로드에 실패했습니다.');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = app.idPhotoFileName || `application-${app.id}-id-photo`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    } finally {
      setDownloadingId(null);
    }
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
            <tr>{['이름', '이메일', '연락처', '소속/직업', '권유자', '접수일', '증명사진', '상태', '온라인 승인', '온라인 답안', '결과', '관리'].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y">
            {apps.length === 0 ? (
              <tr><td colSpan={12} className="text-center py-12 text-muted-foreground">접수자가 없습니다.</td></tr>
            ) : apps.map((a) => {
              const si = statusInfo[a.status] ?? { label: a.status, variant: 'default' as const };
              const submission = getOnlineSubmissionDisplay(a);
              return (
                <tr key={a.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{getApplicantName(a)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{getApplicantEmail(a)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{getApplicantPhone(a)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{(a.formJson?.occupation as string) || '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{a.referrerCode || '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(a.appliedAt).toLocaleDateString('ko-KR')}</td>
                  <td className="px-4 py-3">
                    {a.hasIdPhoto ? (
                      <BrandButton
                        variant="outline"
                        size="sm"
                        loading={downloadingId === a.id}
                        onClick={() => handleDownloadIdPhoto(a)}
                      >
                        다운로드
                      </BrandButton>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><BrandBadge variant={si.variant} className="text-xs">{si.label}</BrandBadge></td>
                  <td className="px-4 py-3">
                    <select
                      value={a.examEligibility ?? 'PENDING'}
                      disabled={updatingId === a.id}
                      onChange={(e) => handleEligibilityChange(a.id, e.target.value)}
                      className="text-xs border rounded px-2 py-1 bg-white"
                    >
                      <option value="PENDING">대기</option>
                      <option value="APPROVED">승인</option>
                      <option value="REJECTED">반려</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <BrandBadge variant={submission.variant} className="text-xs">
                      {submission.label}
                    </BrandBadge>
                    {submission.detail && (
                      <p className="mt-1 text-xs text-muted-foreground">{submission.detail}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isOnlineApplicant(a) && a.attempt && a.attempt.status !== 'IN_PROGRESS' ? (
                      <Link
                        href={`/admin/exam/${id}/results/${a.attempt.id}`}
                        className="text-xs font-semibold text-brand-blue hover:underline"
                      >
                        결과 보기
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
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
