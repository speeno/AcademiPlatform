'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Camera, MonitorCheck } from 'lucide-react';
import { PageLoader } from '@/components/ui/page-loader';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandBadge } from '@/components/ui/brand-badge';
import { apiFetchWithAuth } from '@/lib/api-client';

interface LobbyData {
  canEnter: boolean;
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
}

export default function OnlineExamLobbyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<LobbyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [webcamOk, setWebcamOk] = useState(false);
  const [fullscreenOk, setFullscreenOk] = useState(false);

  useEffect(() => {
    apiFetchWithAuth(`/online-exam/sessions/${id}/lobby`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

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
  const checksPassed =
    (!session.requireWebcam || webcamOk) &&
    (!session.requireFullscreen || fullscreenOk);

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-6">
          <BrandBadge variant={data.canEnter ? 'green' : 'orange'} className="mb-3">
            {data.canEnter ? '입장 가능' : '입장 대기'}
          </BrandBadge>
          <h1 className="text-heading text-brand-blue">{session.qualificationName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{session.roundName}</p>
        </div>

        <div className="grid gap-3 text-sm md:grid-cols-2">
          <div className="rounded-xl bg-muted/30 p-3">
            응시 시작: {session.examWindowStart ? new Date(session.examWindowStart).toLocaleString('ko-KR') : '-'}
          </div>
          <div className="rounded-xl bg-muted/30 p-3">
            응시 종료: {session.examWindowEnd ? new Date(session.examWindowEnd).toLocaleString('ko-KR') : '-'}
          </div>
          <div className="rounded-xl bg-muted/30 p-3">제한 시간: {session.durationMinutes ?? 60}분</div>
          <div className="rounded-xl bg-muted/30 p-3">문항 수: {data.paper?._count?.items ?? 0}개</div>
        </div>

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

        <div className="mt-8 flex justify-end">
          {data.existingAttempt?.status === 'IN_PROGRESS' ? (
            <BrandButton variant="primary" onClick={() => router.push(`/exam/attempt/${data.existingAttempt!.id}`)}>
              기존 응시 이어가기
            </BrandButton>
          ) : (
            <BrandButton
              variant="primary"
              loading={starting}
              disabled={!data.canEnter || !checksPassed}
              onClick={start}
            >
              시험 시작
            </BrandButton>
          )}
        </div>
      </div>
    </main>
  );
}
