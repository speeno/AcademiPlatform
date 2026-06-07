'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList, XCircle } from 'lucide-react';
import { PageLoader } from '@/components/ui/page-loader';
import { BrandBadge } from '@/components/ui/brand-badge';
import { BrandButton } from '@/components/ui/brand-button';
import { ApplicationDepositSummary } from '@/components/exam/ApplicationDepositSummary';
import { PageHeader } from '@/components/layout/PageHeader';
import { apiFetchWithAuth } from '@/lib/api-client';
import { ensureAuthCookieSync, forceLogoutToLogin, getAccessToken } from '@/lib/auth';
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
  examEligibility?: string;
  appliedAt: string;
  formJson?: Record<string, unknown>;
  referrerCode?: string | null;
  depositAccount?: DepositAccountInfo;
  attempt?: { id: string; status: string; result?: { status: string; publishedAt?: string | null } | null } | null;
  examSession?: {
    id: string;
    qualificationName: string;
    roundName: string;
    examAt: string;
    place: string | null;
    examMode?: string;
    examWindowStart?: string | null;
    examWindowEnd?: string | null;
    fee: number;
    displayFee?: number | null;
  } | null;
}

type DisplayExamMode = 'ONLINE' | 'OFFLINE' | 'HYBRID';

function getApplicationExamMode(app: Application): DisplayExamMode {
  const selectedMode = typeof app.formJson?.examMode === 'string'
    ? app.formJson.examMode.toUpperCase()
    : '';
  if (selectedMode === 'ONLINE' || selectedMode === 'OFFLINE') {
    return selectedMode;
  }
  const sessionMode = app.examSession?.examMode;
  if (sessionMode === 'ONLINE' || sessionMode === 'HYBRID') return sessionMode;
  return 'OFFLINE';
}

function getExamModeLabel(mode: DisplayExamMode): string {
  if (mode === 'ONLINE') return '온라인';
  if (mode === 'HYBRID') return '온라인/오프라인';
  return '오프라인';
}

function getExamModeBadgeVariant(mode: DisplayExamMode): 'default' | 'blue' | 'green' {
  if (mode === 'ONLINE') return 'blue';
  if (mode === 'HYBRID') return 'green';
  return 'default';
}

function getExamPlaceLabel(app: Application, mode: DisplayExamMode): string {
  if (mode === 'ONLINE') return '온라인 시험장';
  if (mode === 'HYBRID') {
    return app.examSession?.place
      ? `오프라인: ${app.examSession.place} / 온라인: 온라인 시험장`
      : '온라인 시험장 / 오프라인 장소 미정';
  }
  return app.examSession?.place || '장소 미정';
}

function resolveEffectiveWindowStart(session: NonNullable<Application['examSession']>) {
  const examAt = session.examAt ? new Date(session.examAt) : null;
  const configuredStart = session.examWindowStart ? new Date(session.examWindowStart) : null;
  if (configuredStart && examAt) {
    return configuredStart.getTime() >= examAt.getTime() ? configuredStart : examAt;
  }
  return configuredStart ?? examAt;
}

function getLobbyAvailability(session?: Application['examSession']) {
  if (!session) {
    return {
      canEnterLobby: false,
      lobbyOpenAt: null as Date | null,
      windowStart: null as Date | null,
      isAnytimeMock: false,
    };
  }
  if (!session.examWindowStart && !session.examWindowEnd) {
    return {
      canEnterLobby: true,
      lobbyOpenAt: null as Date | null,
      windowStart: null as Date | null,
      isAnytimeMock: true,
    };
  }
  const windowStart = resolveEffectiveWindowStart(session);
  const windowEnd = session.examWindowEnd ? new Date(session.examWindowEnd) : null;
  const now = new Date();
  const canEnterLobby =
    !!windowStart && !!windowEnd && now >= windowStart && now <= windowEnd;
  return {
    canEnterLobby,
    lobbyOpenAt: windowStart,
    windowStart,
    isAnytimeMock: false,
  };
}

function isAttemptInProgress(status?: string) {
  return status === 'IN_PROGRESS';
}

function isAttemptCompleted(status?: string) {
  return !!status && !isAttemptInProgress(status);
}

export default function ApplicationsPage() {
  const router = useRouter();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    const fetch_ = async () => {
      ensureAuthCookieSync();
      if (!getAccessToken()) {
        forceLogoutToLogin('/mypage/applications');
        return;
      }
      try {
        const res = await apiFetchWithAuth('/exam/my/applications');
        if (res.status === 401) {
          forceLogoutToLogin('/mypage/applications');
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

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader title="시험 신청 내역" description="접수한 시험 일정을 확인하세요." />

      {apps.length === 0 ? (
        <div className="text-center py-20">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">접수한 시험이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {apps.map((app) => {
            const s = statusLabel[app.status] ?? { label: app.status, variant: 'default' as const };
            const applicationExamMode = getApplicationExamMode(app);
            const isOnlineExam = applicationExamMode !== 'OFFLINE';
            const { canEnterLobby, windowStart, isAnytimeMock } = getLobbyAvailability(app.examSession);
            const attemptCompleted = isAttemptCompleted(app.attempt?.status);
            const attemptInProgress = isAttemptInProgress(app.attempt?.status);
            return (
              <div key={app.id} className="bg-white rounded-xl border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <BrandBadge variant={s.variant}>{s.label}</BrandBadge>
                      <BrandBadge variant={getExamModeBadgeVariant(applicationExamMode)}>
                        {getExamModeLabel(applicationExamMode)}
                      </BrandBadge>
                      {isOnlineExam && app.examEligibility === 'APPROVED' && isAnytimeMock && (
                        <BrandBadge variant="blue">상시 모의고사</BrandBadge>
                      )}
                      {attemptCompleted && (
                        <BrandBadge variant="green">시험 완료</BrandBadge>
                      )}
                      {attemptInProgress && (
                        <BrandBadge variant="orange">응시 중</BrandBadge>
                      )}
                    </div>
                    <h3 className="font-bold text-foreground">{app.examSession?.qualificationName ?? '시험'}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{app.examSession?.roundName ?? ''}</p>
                    <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground">
                      <span>시험일: {app.examSession?.examAt ? new Date(app.examSession.examAt).toLocaleDateString('ko-KR') : '-'}</span>
                      <span>시험장소: {getExamPlaceLabel(app, applicationExamMode)}</span>
                      <span>응시료: {Number(
                        app.examSession?.displayFee ?? app.examSession?.fee ?? 0,
                      ).toLocaleString('ko-KR')}원</span>
                      <span>접수일: {new Date(app.appliedAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                    {app.depositAccount && (
                      <ApplicationDepositSummary account={app.depositAccount} />
                    )}
                    {app.attempt?.result?.publishedAt && (
                      <div className="mt-3 rounded-lg border border-brand-blue/20 bg-brand-blue-subtle p-3 text-xs text-brand-blue">
                        시험 결과: {app.attempt.result.status === 'PASSED' ? '합격' : '불합격'}
                      </div>
                    )}
                  </div>
                  {app.status === 'APPLIED' && (
                    <div className="flex flex-col gap-2">
                      {isOnlineExam && app.examEligibility === 'APPROVED' && !attemptCompleted && (
                        <>
                          <BrandButton
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              if (attemptInProgress && app.attempt) {
                                router.push(`/exam/attempt/${app.attempt.id}`);
                              } else {
                                router.push(`/exam/${app.examSession!.id}/lobby`);
                              }
                            }}
                          >
                            {attemptInProgress
                              ? '응시 이어가기'
                              : canEnterLobby
                                ? isAnytimeMock
                                  ? '모의고사 입장'
                                  : '시험장 입장'
                                : '시험장 확인'}
                          </BrandButton>
                          {!canEnterLobby && !attemptInProgress && windowStart && !isAnytimeMock && (
                            <p className="max-w-36 text-xs text-muted-foreground">
                              {windowStart.toLocaleString('ko-KR')}부터 입장
                            </p>
                          )}
                        </>
                      )}
                      {!attemptCompleted && (
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
