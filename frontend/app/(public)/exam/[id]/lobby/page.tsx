'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Camera, MonitorCheck } from 'lucide-react';
import { PageLoader } from '@/components/ui/page-loader';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandBadge } from '@/components/ui/brand-badge';
import { apiFetchWithAuth } from '@/lib/api-client';

interface LobbyData {
  canEnter: boolean;
  canStart?: boolean;
  canEnterLobby?: boolean;
  isAnytimeMock?: boolean;
  effectiveWindowStart?: string | null;
  effectiveWindowEnd?: string | null;
  startBlockedReason?: string | null;
  serverNow?: string;
  lobbyOpenAt?: string | null;
  application: { examEligibility: string; status: string };
  session: {
    qualificationName: string;
    roundName: string;
    examWindowStart?: string | null;
    examWindowEnd?: string | null;
    durationMinutes?: number | null;
    requireFullscreen: boolean;
    requireWebcam: boolean;
  };
  paper?: { id: string; _count?: { items: number } } | null;
  existingAttempt?: { id: string; status: string } | null;
  participants?: Array<{
    id: string;
    name: string;
    email?: string | null;
    status: 'WAITING' | 'IN_PROGRESS';
    startedAt?: string | null;
  }>;
}

export default function OnlineExamLobbyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<LobbyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [webcamOk, setWebcamOk] = useState(false);
  const [fullscreenOk, setFullscreenOk] = useState(false);

  const loadLobby = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const res = await apiFetchWithAuth(`/online-exam/sessions/${id}/lobby`);
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadLobby(true);
  }, [loadLobby]);

  useEffect(() => {
    if (!data || data.canStart || data.isAnytimeMock) return undefined;

    const timer = window.setInterval(() => {
      void loadLobby(false);
    }, 15000);

    return () => window.clearInterval(timer);
  }, [data, loadLobby]);

  const checkWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setWebcamOk(true);
    } catch {
      setWebcamOk(false);
      alert('웹캠 권한을 허용해야 시험에 입장할 수 있습니다.');
    }
  };

  const checkFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setFullscreenOk(true);
    } catch {
      setFullscreenOk(false);
      alert('브라우저 전체화면 전환을 허용해주세요.');
    }
  };

  const start = async () => {
    setStarting(true);
    try {
      const res = await apiFetchWithAuth(`/online-exam/sessions/${id}/attempts/start`, {
        method: 'POST',
      });
      if (!res.ok) {
        alert('시험을 시작할 수 없습니다.');
        return;
      }
      const attempt = await res.json();
      router.push(`/exam/attempt/${attempt.id}`);
    } finally {
      setStarting(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!data) return <div className="mx-auto max-w-2xl py-20 text-center text-muted-foreground">시험 정보를 불러올 수 없습니다.</div>;

  const session = data.session;
  const canStart = data.canStart ?? data.canEnter;
  const canEnterLobby = data.canEnterLobby ?? data.canEnter;
  const isAnytimeMock = !!data.isAnytimeMock;
  const windowStart = data.effectiveWindowStart ?? session.examWindowStart ?? null;
  const windowEnd = data.effectiveWindowEnd ?? session.examWindowEnd ?? null;
  const checksPassed =
    (!session.requireWebcam || webcamOk) &&
    (!session.requireFullscreen || fullscreenOk);
  const waitingParticipants = (data.participants ?? []).filter((item) => item.status === 'WAITING');
  const activeParticipants = (data.participants ?? []).filter((item) => item.status === 'IN_PROGRESS');

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-6">
          <BrandBadge variant={canStart ? 'green' : canEnterLobby ? 'blue' : 'orange'} className="mb-3">
            {canStart ? (isAnytimeMock ? '상시 모의고사 시작 가능' : '시험 시작 가능') : canEnterLobby ? '대기실 입장 중' : '입장 대기'}
          </BrandBadge>
          <h1 className="text-heading text-brand-blue">{session.qualificationName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{session.roundName}</p>
        </div>

        <div className="grid gap-3 text-sm md:grid-cols-2">
          <div className="rounded-xl bg-muted/30 p-3">
            응시 시작: {isAnytimeMock ? '승인 후 상시 가능' : windowStart ? new Date(windowStart).toLocaleString('ko-KR') : '-'}
          </div>
          <div className="rounded-xl bg-muted/30 p-3">
            응시 종료: {isAnytimeMock ? '제한 없음' : windowEnd ? new Date(windowEnd).toLocaleString('ko-KR') : '-'}
          </div>
          <div className="rounded-xl bg-muted/30 p-3">제한 시간: {session.durationMinutes ?? 60}분</div>
          <div className="rounded-xl bg-muted/30 p-3">문항 수: {data.paper?._count?.items ?? 0}개</div>
          <div className="rounded-xl bg-muted/30 p-3">
            대기실 오픈: {isAnytimeMock ? '즉시 입장 가능' : data.lobbyOpenAt ? new Date(data.lobbyOpenAt).toLocaleString('ko-KR') : '-'}
          </div>
        </div>

        {!canStart && canEnterLobby && !isAnytimeMock && (
          <div className="mt-4 rounded-xl border border-brand-blue/20 bg-brand-blue-subtle p-3 text-sm text-brand-blue">
            {data.startBlockedReason ?? '시험 시작 전입니다.'}{' '}
            {windowStart ? `시작 예정: ${new Date(windowStart).toLocaleString('ko-KR')}` : ''}
            <span className="mt-1 block text-xs">시작 시간이 되면 자동으로 상태가 갱신됩니다.</span>
          </div>
        )}
        {!canStart && !canEnterLobby && data.startBlockedReason && (
          <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-900">
            {data.startBlockedReason}
          </div>
        )}

        <div className="mt-6 space-y-3">
          {session.requireWebcam && (
            <BrandButton variant={webcamOk ? 'secondary' : 'outline'} size="sm" onClick={checkWebcam}>
              <Camera className="mr-1 h-4 w-4" /> 웹캠 확인 {webcamOk ? '완료' : ''}
            </BrandButton>
          )}
          {session.requireFullscreen && (
            <BrandButton variant={fullscreenOk ? 'secondary' : 'outline'} size="sm" onClick={checkFullscreen}>
              <MonitorCheck className="mr-1 h-4 w-4" /> 전체화면 확인 {fullscreenOk ? '완료' : ''}
            </BrandButton>
          )}
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border bg-muted/20 p-4">
            <p className="mb-3 text-sm font-semibold">대기 중 응시자 ({waitingParticipants.length})</p>
            <div className="space-y-2">
              {waitingParticipants.length === 0 ? (
                <p className="text-xs text-muted-foreground">대기 중인 응시자가 없습니다.</p>
              ) : (
                waitingParticipants.map((participant) => (
                  <div key={participant.id} className="rounded-lg bg-white px-3 py-2 text-sm">
                    <p className="font-medium">{participant.name}</p>
                    {participant.email && <p className="text-xs text-muted-foreground">{participant.email}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="rounded-xl border bg-muted/20 p-4">
            <p className="mb-3 text-sm font-semibold">시험 중 응시자 ({activeParticipants.length})</p>
            <div className="space-y-2">
              {activeParticipants.length === 0 ? (
                <p className="text-xs text-muted-foreground">시험 중인 응시자가 없습니다.</p>
              ) : (
                activeParticipants.map((participant) => (
                  <div key={participant.id} className="rounded-lg bg-white px-3 py-2 text-sm">
                    <p className="font-medium">{participant.name}</p>
                    {participant.startedAt && (
                      <p className="text-xs text-muted-foreground">
                        시작: {new Date(participant.startedAt).toLocaleTimeString('ko-KR')}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          {data.existingAttempt?.status === 'IN_PROGRESS' ? (
            <BrandButton variant="primary" onClick={() => router.push(`/exam/attempt/${data.existingAttempt!.id}`)}>
              기존 응시 이어가기
            </BrandButton>
          ) : (
            <BrandButton
              variant="primary"
              loading={starting}
              disabled={!canStart || !checksPassed}
              onClick={start}
            >
              {canStart ? '시험 시작' : '시험 시작 대기'}
            </BrandButton>
          )}
        </div>
      </div>
    </main>
  );
}
